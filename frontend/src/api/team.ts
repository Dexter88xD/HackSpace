import api from "./client";
import type { MyTeamResponse, Team, TeamPayload } from "@/types/team";

export async function getMyTeam(hackathonId: number): Promise<MyTeamResponse> {
  const response = await api.get<MyTeamResponse>(
    `/hackathons/${hackathonId}/teams/me`,
  );
  return response.data;
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
