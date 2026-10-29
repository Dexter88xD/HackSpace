import { HackathonFiltersType, HackathonsResponse } from "@/types/hackathon";
import api from "./client";

export const getHackathons = async (params?: HackathonFiltersType) => {
  const response = await api.get<HackathonsResponse>("/hackathons", { params });
  return response.data;
};

export const getMyHackathons = async (
  params?: Pick<HackathonFiltersType, "page" | "limit">,
) => {
  const response = await api.get<HackathonsResponse>("/hackathons/mine", {
    params,
  });
  return response.data;
};
