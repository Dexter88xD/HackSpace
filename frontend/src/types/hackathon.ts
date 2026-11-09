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
  organizationName: string;
  startAt: string;
  endAt: string;
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
  role: HackathonRoleName | null;
};


export type HackathonRegistrationResponse = {
  message: string;
  data: {
    hackathonId: number;
    userId: number;
    role: HackathonRoleName;
  };
};

export type HackathonUnregistrationResponse = {
  message: string;
};

export type HackathonPhaseResponse = {
  id: number;
  phaseName: HackathonPhaseName;
  description: string | null;
  startAt: string;
  endAt: string;
};