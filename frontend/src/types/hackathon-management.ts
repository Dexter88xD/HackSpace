import { HackathonFormValues } from "@/schemas/hackathon.schema";
import {
  Hackathon,
  HackathonPhaseName,
  HackathonPhaseResponse,
} from "./hackathon";

export type HackathonPayload = {
  title: string;
  description: string | null;
  organizationName: string;
  startAt: string;
  endAt: string;
  phases: HackathonPhasePayload[];
};

export type HackathonFormProps = {
  hackathon?: HackathonDetails;
  onSubmit: (data: HackathonFormValues) => void | Promise<void>;
  isSubmitting?: boolean;
  cancelTo?: string;
};

export type HackathonTableProps = {
  hackathons: Hackathon[];
  total: number;
};

export type HackathonDetails = Hackathon & {
  canEdit: boolean;
  phases: HackathonPhaseResponse[];
};

export type HackathonDetailsStateProps = {
  variant: "invalid" | "not-found" | "error" | "forbidden";
  onRetry?: () => void;
};

export type HackathonPhasePayload = {
  phaseName: HackathonPhaseName;
  description?: string | null;
  startAt: string;
  endAt: string;
};

export type UpdateHackathonPayload = Partial<
  Omit<HackathonPayload, "phases">
> & {
  phases?: HackathonPhasePayload[];
};
