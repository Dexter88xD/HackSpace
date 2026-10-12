import api from "./client";
import type { Hackathon } from "@/types/hackathon";
import type { HackathonPayload } from "@/types/hackathon-management";

export async function getHackathonById(id: number): Promise<Hackathon> {
    const response = await api.get<Hackathon>(`/hackathons/${id}`);
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
    data: Partial<HackathonPayload>,
): Promise<Hackathon> {
    const response = await api.patch<Hackathon>(`/hackathons/${id}`, data);
    return response.data;
}
