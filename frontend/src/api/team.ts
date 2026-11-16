import api from "./client";
import type {
  MyJoinRequest,
  MyTeamResponse,
  Team,
  TeamJoinRequest,
  TeamPayload,
  TeamSummary,
} from "@/types/team";

export async function getTeams(hackathonId: number): Promise<TeamSummary[]> {
  const response = await api.get<TeamSummary[]>(
    `/hackathons/${hackathonId}/teams`,
  );
  return response.data;
}

export async function getMyTeam(hackathonId: number): Promise<MyTeamResponse> {
  const response = await api.get<MyTeamResponse>(
    `/hackathons/${hackathonId}/teams/me`,
  );
  return response.data;
}

export async function requestToJoin(teamId: number): Promise<MyJoinRequest> {
  const response = await api.post<MyJoinRequest>(
    `/teams/${teamId}/join-requests`,
  );
  return response.data;
}

export async function getMyJoinRequests(
  hackathonId: number,
): Promise<MyJoinRequest[]> {
  const response = await api.get<MyJoinRequest[]>(
    `/hackathons/${hackathonId}/join-requests/me`,
  );
  return response.data;
}

export async function cancelJoinRequest(requestId: number): Promise<void> {
  await api.delete(`/join-requests/${requestId}`);
}

export async function getJoinRequests(
  teamId: number,
): Promise<TeamJoinRequest[]> {
  const response = await api.get<TeamJoinRequest[]>(
    `/teams/${teamId}/join-requests`,
  );
  return response.data;
}

export async function acceptJoinRequest(requestId: number): Promise<Team> {
  const response = await api.post<Team>(`/join-requests/${requestId}/accept`);
  return response.data;
}

export async function rejectJoinRequest(requestId: number): Promise<void> {
  await api.post(`/join-requests/${requestId}/reject`);
}

export async function removeMember(
  teamId: number,
  userId: number,
): Promise<Team> {
  const response = await api.delete<Team>(`/teams/${teamId}/members/${userId}`);
  return response.data;
}

export async function updateTeam(
  teamId: number,
  data: TeamPayload,
): Promise<Team> {
  const response = await api.patch<Team>(`/teams/${teamId}`, data);
  return response.data;
}

export async function deleteTeam(teamId: number): Promise<void> {
  await api.delete(`/teams/${teamId}`);
}

export async function leaveTeam(teamId: number): Promise<void> {
  await api.delete(`/teams/${teamId}/leave`);
}

export async function createTeam(
  hackathonId: number,
  data: TeamPayload,
): Promise<Team> {
  const response = await api.post<Team>(
    `/hackathons/${hackathonId}/teams`,
    data,
  );
  return response.data;
}
