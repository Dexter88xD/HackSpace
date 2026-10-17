import { HackathonFiltersType, HackathonsResponse } from "@/types/hackathon";
import api from "./client";

export const getHackathons = async (params?: HackathonFiltersType) => {
    const response = await api.get<HackathonsResponse>('/hackathons', {params});
    return response.data;
}