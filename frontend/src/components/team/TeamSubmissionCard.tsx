import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import {
  deleteSubmissionFile,
  getSubmission,
  setSubmissionStatus,
  submissionDownloadUrl,
  uploadSubmissionFile,
  type TeamSubmission,
} from "@/api/team-submission";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  FileUpload,
  FileUploadDropzone,
  FileUploadTrigger,
} from "@/components/ui/file-upload";
import { shouldRetryQuery } from "@/lib/query-retry";
import { formatFileSize } from "@/lib/file-size";

type Action =
  | { type: "upload"; files: File[] }
  | { type: "delete"; id: string }
  | { type: "status"; submitted: boolean };

const acceptedExtensions = ".pdf,.docx,.pptx,.txt,.csv,.jpg,.jpeg,.png";

export function TeamSubmissionCard({ teamId }: { teamId: number }) {
  const queryClient = useQueryClient();
  const queryKey = ["team-submission", teamId];
  const [selection, setSelection] = useState<File[]>([]);
  const [fileError, setFileError] = useState("");
  const query = useQuery({
    queryKey,
    queryFn: ({ signal }) => getSubmission(teamId, signal),
    retry: shouldRetryQuery,
    refetchInterval: 4000,
  });

  const mutation = useMutation({
    mutationFn: async (action: Action) => {
      switch (action.type) {
        case "upload":
          for (const file of action.files) {
            const next = await uploadSubmissionFile(teamId, file);
            queryClient.setQueryData<TeamSubmission>(queryKey, next);
          }
          break;
        case "delete":
          queryClient.setQueryData(
            queryKey,
            await deleteSubmissionFile(teamId, action.id),
          );
          break;
        case "status":
          queryClient.setQueryData(
            queryKey,
            await setSubmissionStatus(teamId, action.submitted),
          );
      }
    },
    onMutate: () => queryClient.cancelQueries({ queryKey }),
    onSettled: async () => {
      setSelection([]);
      await queryClient.invalidateQueries({ queryKey });
    },
  });

  function run(action: Action) {
    setFileError("");
    mutation.mutate(action);
  }

  const submission = query.data;
  const error = mutation.error;
  const serverMessage = isAxiosError<{ message?: string }>(error)
    ? error.response?.status === 413
      ? "This file is too large. Choose a smaller file."
      : error.response?.data?.message
    : undefined;
  const busy = mutation.isPending;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Submission</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {query.isPending && <p role="status">Loading submission…</p>}
        {query.isError && (
          <div className="space-y-2">
            <p role="alert">Could not load the latest submission details.</p>
            <Button variant="outline" onClick={() => void query.refetch()}>
              Retry
            </Button>
          </div>
        )}
        {query.isSuccess && submission && (
          <>
            <p role="status" className="text-sm">
              {submission.submittedAt
                ? `Submitted on ${new Date(submission.submittedAt).toLocaleString()}`
                : "Draft"}
            </p>
            {submission.files.length > 0 ? (
              <ul
                aria-label="Submission files"
                className="divide-y rounded-md border"
              >
                {submission.files.map((file) => (
                  <li
                    key={file.id}
                    className="flex items-center justify-between gap-2 p-2"
                  >
                    <a
                      className="min-w-0 break-words underline"
                      href={submissionDownloadUrl(teamId, file.id)}
                    >
                      {file.name}
                    </a>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={busy || !!submission.blocked.delete}
                      aria-label={`Delete ${file.name}`}
                      onClick={() => run({ type: "delete", id: file.id })}
                    >
                      Delete
                    </Button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">
                No files uploaded yet.
              </p>
            )}
            {submission.blocked.upload ? (
              <p className="text-sm text-muted-foreground">
                {submission.blocked.upload}
              </p>
            ) : (
              <FileUpload
                value={selection}
                onValueChange={setSelection}
                onAccept={(files) => mutation.mutate({ type: "upload", files })}
                onFileReject={(file, reason) =>
                  setFileError(`${file.name}: ${reason}`)
                }
                accept={acceptedExtensions}
                maxFiles={submission.filesLimit - submission.files.length}
                maxSize={submission.fileMaxSize}
                multiple
                disabled={busy}
              >
                <FileUploadDropzone
                  onClick={() => setFileError("")}
                  onDrop={() => setFileError("")}
                  className="flex flex-col items-center gap-3 rounded-md border border-dashed p-5 text-center"
                >
                  <p className="text-sm">
                    Drop files here or choose files to upload.
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {submission.files.length} of {submission.filesLimit} files.
                    Maximum {formatFileSize(submission.fileMaxSize)} per file.
                  </p>
                  <FileUploadTrigger
                    render={<Button type="button" variant="outline" />}
                  >
                    Choose files
                  </FileUploadTrigger>
                </FileUploadDropzone>
              </FileUpload>
            )}
            <Button
              disabled={
                busy ||
                !!(submission.isSubmitted
                  ? submission.blocked.unsubmit
                  : submission.blocked.submit)
              }
              onClick={() =>
                run({ type: "status", submitted: !submission.isSubmitted })
              }
            >
              {submission.isSubmitted ? "Unsubmit" : "Submit"}
            </Button>
            {!submission.isSubmitted &&
              submission.blocked.submit &&
              submission.blocked.submit !== submission.blocked.upload && (
                <p className="text-sm text-muted-foreground">
                  {submission.blocked.submit}
                </p>
              )}
            {busy && (
              <p role="status" className="text-sm">
                Updating submission…
              </p>
            )}
            {(fileError || error) && (
              <p role="alert" className="text-sm text-destructive">
                {serverMessage ??
                  (error ? "Could not update the submission." : fileError)}
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
