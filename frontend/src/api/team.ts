import api from "./client";
import type {
  MyTeamResponse,
  Team,
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

export async function joinTeam(teamId: number): Promise<Team> {
  const response = await api.post<Team>(`/teams/${teamId}/join`);
  return response.data;
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
