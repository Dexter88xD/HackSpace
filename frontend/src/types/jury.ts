export type HackathonJudge = {
  id: number;
  userId: number;
  username: string;
};

export type AssignJudgePayload = {
  userId: number;
};

export type AssignJudgeResponse = {
  id: number;
  userId: number;
  hackathonId: number;
  role: "JURY";
};

export type ScoringCriterion = {
  id: number;
  hackathonId: number;
  title: string;
  description: string | null;
};

export type CreateScoringCriterionPayload = {
  title: string;
  description?: string | null;
};

export type UpdateScoringCriterionPayload = {
  title?: string;
  description?: string | null;
};

export type EligibleTeam = {
  teamId: number;
  teamName: string;
  submittedAt: string;
  scoredCount: number;
  totalCriteria: number;
  isComplete: boolean;
};

export type CriterionScore = {
  criterionId: number;
  title: string;
  score: number | null;
  comment: string | null;
};

export type TeamEvaluation = {
  hackathonId: number;
  teamId: number;
  judgeId: number;
  isComplete: boolean;
  scoredCount: number;
  totalCriteria: number;
  scores: CriterionScore[];
};

export type CriterionScorePayload = {
  criterionId: number;
  score: number;
  comment?: string | null;
};

export type UpsertTeamScoresPayload = {
  scores: CriterionScorePayload[];
};

export type RankingStatus = "EVALUATED" | "NOT_EVALUATED";

export type TeamRanking = {
  rank: number | null;
  teamId: number;
  teamName: string;
  averageScore: number | null;
  completedEvaluations: number;
  status: RankingStatus;
};
