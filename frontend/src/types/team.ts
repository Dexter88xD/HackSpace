export type TeamMember = {
  userId: number;
  username: string;
  fullName: string;
  joinedAt: string;
};

export type Team = {
  id: number;
  name: string;
  description: string | null;
  createdAt: string;
  hackathonId: number;
  minMembers: number;
  maxMembers: number;
  leaderId: number | null;
  members: TeamMember[];
};

export type TeamSummary = {
  id: number;
  name: string;
  description: string | null;
  memberCount: number;
  maxMembers: number;
};

export type MyTeamResponse = {
  team: Team | null;
};

export type TeamPayload = {
  name: string;
  description: string | null;
};

export type MyJoinRequest = {
  id: number;
  teamId: number;
  createdAt: string;
};

export type TeamJoinRequest = {
  id: number;
  userId: number;
  username: string;
  fullName: string;
  createdAt: string;
};
