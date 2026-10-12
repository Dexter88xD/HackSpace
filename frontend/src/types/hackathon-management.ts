import type { Hackathon } from "@/types/hackathon";

export type HackathonPayload = Pick<
    Hackathon,
    "title" | "description" | "organization_name" | "start_at" | "end_at"
>;
