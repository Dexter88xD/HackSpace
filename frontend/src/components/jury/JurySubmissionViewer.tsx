import { useQuery } from "@tanstack/react-query";

import { getSubmission, submissionDownloadUrl } from "@/api/team-submission";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { shouldRetryQuery } from "@/lib/query-retry";
import { getJuryError } from "./jury-error";

type Props = {
  teamId: number;
  userId: number;
};

export function JurySubmissionViewer({ teamId, userId }: Props) {
  const query = useQuery({
    queryKey: ["jury-submission", userId, teamId],
    queryFn: ({ signal }) => getSubmission(teamId, signal),
    retry: shouldRetryQuery,
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Team submission</CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {query.isPending && <p role="status">Loading submission...</p>}

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
              {query.data.submittedAt
                ? `Submitted on ${new Date(
                    query.data.submittedAt,
                  ).toLocaleString()}`
                : "Not submitted"}
            </p>

            {query.data.files.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No submission files available.
              </p>
            ) : (
              <ul className="divide-y rounded-md border">
                {query.data.files.map((file) => (
                  <li
                    key={file.id}
                    className="flex flex-wrap items-center justify-between gap-3 p-3"
                  >
                    <div className="min-w-0 break-all">
                      <p className="text-sm font-medium">{file.name}</p>

                      <p className="text-xs text-muted-foreground">
                        {file.fileType}
                      </p>
                    </div>

                    <a
                      href={submissionDownloadUrl(teamId, file.id)}
                      className="text-sm font-medium underline"
                      download
                    >
                      Download
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
