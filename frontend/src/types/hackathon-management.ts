import type { HackathonFormValues } from "@/schemas/hackathon.schema";
import type {
  Hackathon,
  HackathonPhaseName,
  HackathonPhaseResponse,
  HackathonSettings,
} from "./hackathon";

export type HackathonPayload = {
  title: string;
  description: string | null;
  organizationName: string;
  startAt: string;
  endAt: string;
  phases: HackathonPhasePayload[];
  settings?: HackathonSettingsPayload;
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
  settings: HackathonSettings;
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

export type HackathonSettingsPayload = Partial<Omit<HackathonSettings, "id">>;

export type UpdateHackathonPayload = Partial<
  Omit<HackathonPayload, "phases">
> & {
  phases?: HackathonPhasePayload[];
};
