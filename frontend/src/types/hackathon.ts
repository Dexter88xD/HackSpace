export enum HackathonPhaseName {
  LAUNCH = "LAUNCH",
  REGISTRATION = "REGISTRATION",
  IN_PROGRESS = "IN_PROGRESS",
  EVALUATION = "EVALUATION",
  FINISHED = "FINISHED",
}

export enum HackathonRoleName {
  ORGANIZER = "ORGANIZER",
  PARTICIPANT = "PARTICIPANT",
  JURY = "JURY",
  MENTOR = "MENTOR",
}

export type HackathonFiltersType = {
  search?: string;
  phase?: HackathonPhaseName;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
};

export type Hackathon = {
  id: number;
  title: string;
  description: string | null;
  organization_name: string;
  start_at: string;
  end_at: string;
};

export type HackathonCardProps = {
  hackathon: Hackathon;
};

export type HackathonsResponse = {
  data: Hackathon[];
  total: number;
  page: number;
  limit: number;
};

export type HackathonPaginationProps = {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
};

export type HackathonMembershipResponse = {
  isRegistered: boolean;
  role: HackathonRoleName;
};


export type HackathonRegistrationResponse = {
  message: string;
  data: {
    hackathonId: number;
    userId: number;
    role: HackathonRoleName;
  };
};
