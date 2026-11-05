import {
  HackathonFiltersType,
  HackathonMembershipResponse,
  HackathonPhaseResponse,
  HackathonRegistrationResponse,
  HackathonsResponse,
} from "@/types/hackathon";
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

export const getHackathonMembership = async (hackahtonId: number) => {
  const response = await api.get<HackathonMembershipResponse>(
    `hackathons/${hackahtonId}/membership`,
  );
  return response.data;
};

export const getHackathonCurrentPhase = async (hackathonId: number) => {
  const response = await api.get<HackathonPhaseResponse | null>(`hackathons/${hackathonId}/current-phase`);
  return response.data;
}

export const hackathonRegister = async (hackathonId: number | null) => {
  const response = await api.post<HackathonRegistrationResponse>(`hackathons/${hackathonId}/register`)
  return response.data;
}

export const hackathonUnregister = async (hackathonId: number | null) => {
  const response = await api.delete<HackathonRegistrationResponse>(`hackathons/${hackathonId}/unregister`)
  return response.data;
}