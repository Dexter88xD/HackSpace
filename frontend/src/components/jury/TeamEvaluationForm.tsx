import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { getMyTeamScores, upsertTeamScores } from "@/api/jury";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { shouldRetryQuery } from "@/lib/query-retry";
import type { CriterionScorePayload, TeamEvaluation } from "@/types/jury";
import { getJuryError } from "./jury-error";

type Props = {
  hackathonId: number;
  teamId: number;
  userId: number;
};

type ScoreDraft = {
  criterionId: number;
  score: string;
  comment: string;
};

function createDraft(evaluation: TeamEvaluation): ScoreDraft[] {
  return evaluation.scores.map((criterion) => ({
    criterionId: criterion.criterionId,
    score: criterion.score === null ? "" : String(criterion.score),
    comment: criterion.comment ?? "",
  }));
}

function EvaluationEditor({
  hackathonId,
  teamId,
  userId,
  evaluation,
}: Props & { evaluation: TeamEvaluation }) {
  const queryClient = useQueryClient();

  const [draft, setDraft] = useState(() => createDraft(evaluation));

  const [saved, setSaved] = useState(evaluation);
  const [validationError, setValidationError] = useState("");

  const queryKey = ["jury-team-scores", userId, hackathonId, teamId];

  const mutation = useMutation({
    mutationFn: (scores: CriterionScorePayload[]) =>
      upsertTeamScores(hackathonId, teamId, { scores }),

    onSuccess: async (result) => {
      setSaved(result);
      setDraft(createDraft(result));

      queryClient.setQueryData(queryKey, result);

      await queryClient.invalidateQueries({
        queryKey: ["jury-teams", userId, hackathonId],
      });
    },
  });

  function updateDraft(
    criterionId: number,
    field: "score" | "comment",
    value: string,
  ) {
    setValidationError("");
    mutation.reset();

    setDraft((previous) =>
      previous.map((criterion) =>
        criterion.criterionId === criterionId
          ? { ...criterion, [field]: value }
          : criterion,
      ),
    );
  }

  function save() {
    setValidationError("");

    const scores: CriterionScorePayload[] = [];

    for (const item of draft) {
      const existing = saved.scores.find(
        (criterion) => criterion.criterionId === item.criterionId,
      );

      if (item.score.trim() === "") {
        if (existing?.score != null) {
          setValidationError("Previously saved scores cannot be removed.");
          return;
        }

        if (item.comment.trim()) {
          setValidationError("Enter a score before adding a comment.");
          return;
        }

        continue;
      }

      const score = Number(item.score);

      if (!Number.isInteger(score) || score < 0 || score > 10) {
        setValidationError("Scores must be whole numbers between 0 and 10.");
        return;
      }

      if (item.comment.length > 1000) {
        setValidationError("Comments cannot exceed 1000 characters.");
        return;
      }

      const comment = item.comment.trim() || null;

      if (
        score === existing?.score &&
        comment === (existing?.comment ?? null)
      ) {
        continue;
      }

      scores.push({
        criterionId: item.criterionId,
        score,
        comment,
      });
    }

    if (scores.length === 0) {
      setValidationError("There are no score changes to save.");
      return;
    }

    mutation.mutate(scores);
  }

  if (saved.totalCriteria === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No scoring criteria have been configured.
      </p>
    );
  }

  return (
    <form
      className="space-y-5"
      onSubmit={(event) => {
        event.preventDefault();

        if (!mutation.isPending) {
          save();
        }
      }}
    >
      <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-medium">
            {saved.scoredCount}/{saved.totalCriteria} criteria scored
          </p>

          <p className="text-sm text-muted-foreground">
            {saved.isComplete ? "Evaluation complete" : "Evaluation incomplete"}
          </p>
        </div>

        <progress
          className="h-2 w-full"
          value={saved.scoredCount}
          max={saved.totalCriteria}
          aria-label="Saved evaluation progress"
        />
      </div>

      <p className="text-sm text-muted-foreground">
        Score each criterion from 0 to 10. You can save a partial evaluation and
        return to it later.
      </p>

      {draft.map((item) => {
        const criterion = saved.scores.find(
          (score) => score.criterionId === item.criterionId,
        );

        return (
          <div
            key={item.criterionId}
            className="space-y-3 rounded-md border p-4"
          >
            <h3 className="break-words font-medium">{criterion?.title}</h3>

            <label className="block space-y-2 text-sm">
              <span>Score (0–10)</span>

              <input
                type="number"
                min={0}
                max={10}
                step={1}
                value={item.score}
                disabled={mutation.isPending}
                placeholder="Not scored"
                className="w-full rounded-md border bg-background px-3 py-2 sm:max-w-36"
                onChange={(event) =>
                  updateDraft(item.criterionId, "score", event.target.value)
                }
              />
            </label>

            <label className="block space-y-2 text-sm">
              <span>Comment (optional)</span>

              <textarea
                rows={3}
                maxLength={1000}
                value={item.comment}
                disabled={mutation.isPending}
                placeholder="Add private evaluation notes..."
                className="w-full resize-y rounded-md border bg-background px-3 py-2"
                onChange={(event) =>
                  updateDraft(item.criterionId, "comment", event.target.value)
                }
              />
            </label>

            <p className="text-right text-xs text-muted-foreground">
              {item.comment.length}/1000
            </p>
          </div>
        );
      })}

      {(validationError || mutation.isError) && (
        <p role="alert" className="text-sm text-destructive">
          {validationError || getJuryError(mutation.error)}
        </p>
      )}

      {mutation.isSuccess && (
        <p role="status" className="text-sm text-muted-foreground">
          Evaluation saved successfully.
        </p>
      )}

      <Button type="submit" disabled={mutation.isPending}>
        {mutation.isPending ? "Saving..." : "Save evaluation"}
      </Button>
    </form>
  );
}

export function TeamEvaluationForm({ hackathonId, teamId, userId }: Props) {
  const query = useQuery({
    queryKey: ["jury-team-scores", userId, hackathonId, teamId],
    queryFn: () => getMyTeamScores(hackathonId, teamId),
    retry: shouldRetryQuery,
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Evaluation</CardTitle>
      </CardHeader>

      <CardContent>
        {query.isPending && <p role="status">Loading evaluation...</p>}

        {query.isError && (
          <div className="space-y-2">
            <p role="alert" className="text-sm text-destructive">
              {getJuryError(query.error)}
            </p>

            <Button variant="outline" onClick={() => void query.refetch()}>
              Retry
            </Button>
          </div>
        )}

        {query.isSuccess && (
          <EvaluationEditor
            key={`${userId}:${hackathonId}:${teamId}`}
            hackathonId={hackathonId}
            teamId={teamId}
            userId={userId}
            evaluation={query.data}
          />
        )}
      </CardContent>
    </Card>
  );
}
