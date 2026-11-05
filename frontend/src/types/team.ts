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
  members: TeamMember[];
};

export type MyTeamResponse = {
  team: Team | null;
};

export type TeamPayload = {
  name: string;
  description: string | null;
};
