import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { createScoringCriterion, getScoringCriteria } from "@/api/jury";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { shouldRetryQuery } from "@/lib/query-retry";
import { getJuryError } from "./jury-error";

type Props = {
  hackathonId: number;
  canManage: boolean;
};

export function ScoringCriteriaManagement({ hackathonId, canManage }: Props) {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const queryKey = ["scoring-criteria", hackathonId];

  const criteriaQuery = useQuery({
    queryKey,
    queryFn: () => getScoringCriteria(hackathonId),
    retry: shouldRetryQuery,
  });

  const createMutation = useMutation({
    mutationFn: () =>
      createScoringCriterion(hackathonId, {
        title: title.trim(),
        description: description.trim() || undefined,
      }),

    onSuccess: async () => {
      setTitle("");
      setDescription("");
      await queryClient.invalidateQueries({ queryKey });
    },
  });

  const criteria = criteriaQuery.data ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between gap-2">
          <span>Scoring criteria</span>

          {criteriaQuery.isSuccess && (
            <span className="text-xs font-normal text-muted-foreground">
              {criteria.length} total
            </span>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Equal weight · 0–10 points per criterion
        </p>

        {criteriaQuery.isPending && <p role="status">Loading criteria...</p>}

        {criteriaQuery.isError && (
          <div className="space-y-2">
            <p role="alert" className="text-sm text-destructive">
              {getJuryError(criteriaQuery.error)}
            </p>

            <Button
              variant="outline"
              onClick={() => void criteriaQuery.refetch()}
            >
              Retry
            </Button>
          </div>
        )}

        {criteriaQuery.isSuccess &&
          (criteria.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No scoring criteria defined yet.
            </p>
          ) : (
            <ul className="divide-y rounded-md border">
              {criteria.map((criterion) => (
                <li key={criterion.id} className="space-y-1 p-3">
                  <h3 className="break-words font-medium">{criterion.title}</h3>

                  {criterion.description && (
                    <p className="whitespace-pre-wrap break-words text-sm text-muted-foreground">
                      {criterion.description}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          ))}
        {!canManage && (
          <p className="text-xs text-muted-foreground">
            Scoring criteria can only be configured during launch and
            registration.
          </p>
        )}

        {canManage && criteriaQuery.isSuccess && (
          <form
            className="space-y-4 border-t pt-4"
            onSubmit={(event) => {
              event.preventDefault();

              if (title.trim() && !createMutation.isPending) {
                createMutation.mutate();
              }
            }}
          >
            <h3 className="font-medium">Add a scoring criterion</h3>

            <label className="block space-y-2 text-sm">
              <span>Title</span>

              <input
                required
                value={title}
                maxLength={100}
                disabled={createMutation.isPending}
                placeholder="e.g. Innovation"
                className="w-full rounded-md border bg-background px-3 py-2"
                onChange={(event) => {
                  setTitle(event.target.value);
                  createMutation.reset();
                }}
              />
            </label>

            <label className="block space-y-2 text-sm">
              <span>Description (optional)</span>

              <textarea
                value={description}
                rows={2}
                disabled={createMutation.isPending}
                placeholder="Describe what judges should evaluate..."
                className="w-full resize-y rounded-md border bg-background px-3 py-2"
                onChange={(event) => {
                  setDescription(event.target.value);
                  createMutation.reset();
                }}
              />
            </label>

            <Button
              type="submit"
              disabled={!title.trim() || createMutation.isPending}
            >
              {createMutation.isPending ? "Adding..." : "Add criterion"}
            </Button>

            {createMutation.isError && (
              <p role="alert" className="text-sm text-destructive">
                {getJuryError(createMutation.error)}
              </p>
            )}

            {createMutation.isSuccess && (
              <p role="status" className="text-sm text-muted-foreground">
                Criterion added successfully.
              </p>
            )}
          </form>
        )}
      </CardContent>
    </Card>
  );
}
