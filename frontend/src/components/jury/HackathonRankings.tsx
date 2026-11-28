import { useQuery } from "@tanstack/react-query";

import { getHackathonRankings } from "@/api/jury";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { shouldRetryQuery } from "@/lib/query-retry";
import { getJuryError } from "./jury-error";

type Props = {
  hackathonId: number;
  userId: number;
  isPublished: boolean;
};

export function HackathonRankings({ hackathonId, userId, isPublished }: Props) {
  const query = useQuery({
    queryKey: ["hackathon-rankings", userId, hackathonId, isPublished],
    queryFn: () => getHackathonRankings(hackathonId),
    retry: shouldRetryQuery,
    refetchInterval: isPublished ? false : 10000,
  });

  const rankings = query.data ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {isPublished ? "Final rankings" : "Rankings preview"}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {query.isPending && <p role="status">Loading rankings...</p>}

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
            {rankings.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No eligible teams to rank yet.
              </p>
            ) : (
              <>
                <div className="divide-y rounded-md border md:hidden">
                  {rankings.map((team) => (
                    <div key={team.teamId} className="space-y-3 p-3">
                      <div className="flex items-center gap-3">
                        <span className="shrink-0 text-sm font-semibold">
                          {team.rank === null ? "—" : `#${team.rank}`}
                        </span>

                        <span className="min-w-0 flex-1 break-words text-sm font-medium">
                          {team.teamName}
                        </span>

                        <span className="shrink-0 whitespace-nowrap text-sm font-semibold tabular-nums">
                          {team.averageScore === null
                            ? "—"
                            : `${team.averageScore.toFixed(2)}/10`}
                        </span>
                      </div>

                      {!isPublished && (
                        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                          <span>Evaluations: {team.completedEvaluations}</span>

                          <span>
                            {team.status === "EVALUATED"
                              ? "Evaluated"
                              : "Not evaluated"}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <div className="hidden overflow-x-auto rounded-md border md:block">
                  <table className="w-full text-sm">
                    <thead className="border-b bg-muted/50">
                      <tr>
                        <th scope="col" className="p-3 text-left">
                          Rank
                        </th>
                        <th scope="col" className="p-3 text-left">
                          Team
                        </th>
                        <th scope="col" className="p-3 text-right">
                          Score
                        </th>
                        {!isPublished && (
                          <>
                            <th scope="col" className="p-3 text-center">
                              Evaluations
                            </th>

                            <th scope="col" className="p-3 text-left">
                              Status
                            </th>
                          </>
                        )}
                      </tr>
                    </thead>

                    <tbody className="divide-y">
                      {rankings.map((team) => (
                        <tr key={team.teamId}>
                          <td className="p-3 font-semibold">
                            {team.rank ?? "—"}
                          </td>

                          <td className="min-w-36 break-words p-3 font-medium">
                            {team.teamName}
                          </td>

                          <td className="whitespace-nowrap p-3 text-right tabular-nums">
                            {team.averageScore === null
                              ? "—"
                              : `${team.averageScore.toFixed(2)}/10`}
                          </td>

                          {!isPublished && (
                            <>
                              <td className="p-3 text-center">
                                {team.completedEvaluations}
                              </td>

                              <td className="whitespace-nowrap p-3 text-muted-foreground">
                                {team.status === "EVALUATED"
                                  ? "Evaluated"
                                  : "Not evaluated"}
                              </td>
                            </>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
