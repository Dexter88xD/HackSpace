import api from "./client";
import type { Hackathon } from "@/types/hackathon";
import type {
  HackathonDetails,
  HackathonPayload,
  UpdateHackathonPayload,
} from "@/types/hackathon-management";

export async function getHackathonById(id: number): Promise<HackathonDetails> {
  const response = await api.get<HackathonDetails>(`/hackathons/${id}`);
  return response.data;
}

export async function createHackathon(
  data: HackathonPayload,
): Promise<Hackathon> {
  const response = await api.post<Hackathon>("/hackathons", data);
  return response.data;
}

export async function updateHackathon(
  id: number,
  data: UpdateHackathonPayload,
): Promise<Hackathon> {
  const response = await api.patch<Hackathon>(`/hackathons/${id}`, data);
  return response.data;
}
