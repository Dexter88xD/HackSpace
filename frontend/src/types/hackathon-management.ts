import { HackathonFormValues } from "@/schemas/hackathon.schema";
import { Hackathon } from "./hackathon";

export type HackathonPayload = {
    title: string;
    description: string | null;
    organizationName: string;
    startAt: string;
    endAt: string;
};

export type HackathonFormProps = {
  hackathon?: Hackathon;
  onSubmit: (data: HackathonFormValues) => void | Promise<void>;
  isSubmitting?: boolean;
};

export type HackathonTableProps = {
  hackathons: Hackathon[];
  total: number;
};
