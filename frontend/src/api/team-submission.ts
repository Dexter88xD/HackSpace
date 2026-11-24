import api from "./client";

export interface TeamSubmission {
  submittedAt: string | null;
  isSubmitted: boolean;
  filesLimit: number;
  fileMaxSize: number;
  files: { id: string; name: string; fileType: string }[];
  blocked: Record<"upload" | "delete" | "submit" | "unsubmit", string | null>;
}

function path(teamId: number) {
  return `/teams/${teamId}/submission`;
}

export async function getSubmission(teamId: number, signal?: AbortSignal) {
  const { data } = await api.get<TeamSubmission>(path(teamId), { signal });
  return data;
}

export async function uploadSubmissionFile(teamId: number, file: File) {
  const body = new FormData();
  body.append("file", file);
  const { data } = await api.post<TeamSubmission>(
    `${path(teamId)}/files`,
    body,
  );
  return data;
}

export async function deleteSubmissionFile(teamId: number, fileId: string) {
  const { data } = await api.delete<TeamSubmission>(
    `${path(teamId)}/files/${fileId}`,
  );
  return data;
}

export function submissionDownloadUrl(teamId: number, fileId: string) {
  return `/api${path(teamId)}/files/${fileId}`;
}

export async function setSubmissionStatus(teamId: number, submitted: boolean) {
  const action = submitted ? "submit" : "unsubmit";
  const { data } = await api.post<TeamSubmission>(`${path(teamId)}/${action}`);
  return data;
}
