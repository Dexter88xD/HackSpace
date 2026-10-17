export enum HackathonPhaseName {
  LAUNCH = "LAUNCH",
  REGISTRATION = "REGISTRATION",
  IN_PROGRESS = "IN_PROGRESS",
  EVALUATION = "EVALUATION",
  FINISHED = "FINISHED",
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
  hackathon: Hackathon
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
