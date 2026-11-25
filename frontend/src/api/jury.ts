import api from "./client";

import type {
  AssignJudgePayload,
  CreateScoringCriterionPayload,
  EligibleTeam,
  HackathonJudge,
  ScoringCriterion,
  TeamEvaluation,
  TeamRanking,
  UpsertTeamScoresPayload,
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
  const { data } = await api.post<HackathonJudge>(
    `/hackathons/${hackathonId}/judges`,
    payload,
  );

  return data;
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
