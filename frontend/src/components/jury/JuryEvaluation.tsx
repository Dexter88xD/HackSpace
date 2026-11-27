import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { getEligibleTeams } from "@/api/jury";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { shouldRetryQuery } from "@/lib/query-retry";
import { JurySubmissionViewer } from "./JurySubmissionViewer";
import { TeamEvaluationForm } from "./TeamEvaluationForm";
import { getJuryError } from "./jury-error";

type Props = {
  hackathonId: number;
  userId: number;
};

export function JuryEvaluation({ hackathonId, userId }: Props) {
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null);

  const query = useQuery({
    queryKey: ["jury-teams", userId, hackathonId],
    queryFn: () => getEligibleTeams(hackathonId),
    retry: shouldRetryQuery,
  });

  const teams = query.data ?? [];

  const selectedTeam = teams.find((team) => team.teamId === selectedTeamId);

  const completedTeams = teams.filter((team) => team.isComplete).length;

  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold">Jury evaluation</h2>

      <Card>
        <CardHeader>
          <CardTitle>Eligible teams</CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          {query.isPending && <p role="status">Loading eligible teams...</p>}

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
            <>
              <p className="text-sm text-muted-foreground">
                {completedTeams}/{teams.length} teams evaluated
              </p>

              {teams.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No teams have finalised their submissions.
                </p>
              ) : (
                <ul className="divide-y rounded-md border">
                  {teams.map((team) => (
                    <li
                      key={team.teamId}
                      className="flex flex-wrap items-center justify-between gap-3 p-3"
                    >
                      <div className="min-w-0 break-words">
                        <p className="font-medium">{team.teamName}</p>

                        <p className="text-sm text-muted-foreground">
                          {team.scoredCount}/{team.totalCriteria} criteria
                          scored
                        </p>

                        <p className="text-xs text-muted-foreground">
                          {team.isComplete
                            ? "Complete"
                            : team.scoredCount > 0
                              ? "In progress"
                              : "Not started"}
                        </p>
                      </div>

                      <Button
                        size="sm"
                        variant={
                          selectedTeamId === team.teamId ? "default" : "outline"
                        }
                        aria-pressed={selectedTeamId === team.teamId}
                        onClick={() => setSelectedTeamId(team.teamId)}
                      >
                        {selectedTeamId === team.teamId
                          ? "Selected"
                          : team.isComplete
                            ? "Edit scores"
                            : "Evaluate"}
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {query.isSuccess && selectedTeam && (
        <section
          key={`${userId}:${hackathonId}:${selectedTeam.teamId}`}
          className="space-y-4"
        >
          <h3 className="text-lg font-semibold">
            Evaluating {selectedTeam.teamName}
          </h3>

          <JurySubmissionViewer teamId={selectedTeam.teamId} userId={userId} />

          <TeamEvaluationForm
            hackathonId={hackathonId}
            teamId={selectedTeam.teamId}
            userId={userId}
          />
        </section>
      )}
    </section>
  );
}
