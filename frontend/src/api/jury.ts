import api from "./client";

import type {
  AssignJudgePayload,
  AssignJudgeResponse,
  CreateScoringCriterionPayload,
  EligibleTeam,
  HackathonJudge,
  ScoringCriterion,
  TeamEvaluation,
  TeamRanking,
  UpsertTeamScoresPayload,
  UpdateScoringCriterionPayload,
} from "@/types/jury";

export async function getHackathonJudges(hackathonId: number) {
  const { data } = await api.get<HackathonJudge[]>(
    `/hackathons/${hackathonId}/judges`,
  );

  return data;
}

export async function assignHackathonJudge(
  hackathonId: number,
  payload: AssignJudgePayload,
) {
  const { data } = await api.post<AssignJudgeResponse>(
    `/hackathons/${hackathonId}/judges`,
    payload,
  );

  return data;
}

export async function removeHackathonJudge(
  hackathonId: number,
  judgeId: number,
): Promise<void> {
  await api.delete(`/hackathons/${hackathonId}/judges/${judgeId}`);
}

export async function getScoringCriteria(hackathonId: number) {
  const { data } = await api.get<ScoringCriterion[]>(
    `/hackathons/${hackathonId}/criteria`,
  );

  return data;
}

export async function createScoringCriterion(
  hackathonId: number,
  payload: CreateScoringCriterionPayload,
) {
  const { data } = await api.post<ScoringCriterion>(
    `/hackathons/${hackathonId}/criteria`,
    payload,
  );

  return data;
}

export async function updateScoringCriterion(
  hackathonId: number,
  criterionId: number,
  payload: UpdateScoringCriterionPayload,
) {
  const { data } = await api.patch<ScoringCriterion>(
    `/hackathons/${hackathonId}/criteria/${criterionId}`,
    payload,
  );

  return data;
}

export async function removeScoringCriterion(
  hackathonId: number,
  criterionId: number,
): Promise<void> {
  await api.delete(`/hackathons/${hackathonId}/criteria/${criterionId}`);
}

export async function getEligibleTeams(hackathonId: number) {
  const { data } = await api.get<EligibleTeam[]>(
    `/hackathons/${hackathonId}/jury/teams`,
  );

  return data;
}

export async function getMyTeamScores(hackathonId: number, teamId: number) {
  const { data } = await api.get<TeamEvaluation>(
    `/hackathons/${hackathonId}/teams/${teamId}/scores/me`,
  );

  return data;
}

export async function upsertTeamScores(
  hackathonId: number,
  teamId: number,
  payload: UpsertTeamScoresPayload,
) {
  const { data } = await api.put<TeamEvaluation>(
    `/hackathons/${hackathonId}/teams/${teamId}/scores`,
    payload,
  );

  return data;
}

export async function getHackathonRankings(hackathonId: number) {
  const { data } = await api.get<TeamRanking[]>(
    `/hackathons/${hackathonId}/rankings`,
  );

  return data;
}
