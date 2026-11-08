import api from "./client";
import type { Skill } from "@/types/skill";

export async function searchSkills(
  name: string,
  signal?: AbortSignal,
): Promise<Skill[]> {
  const response = await api.get<Skill[]>("/skills", {
    params: { name },
    signal,
  });
  return response.data;
}

export async function getProfileSkills(
  profileId: number,
  signal?: AbortSignal,
): Promise<Skill[]> {
  const response = await api.get<Skill[]>(`/skills/profiles/${profileId}`, {
    signal,
  });
  return response.data;
}

export async function addProfileSkill(
  profileId: number,
  skill: { id: number } | { name: string },
): Promise<Skill> {
  const response = await api.post<Skill>("/skills", { profileId, ...skill });
  return response.data;
}

export async function removeProfileSkills(
  profileId: number,
  skillIds: number[],
): Promise<void> {
  await api.delete(`/skills/profiles/${profileId}`, { data: { skillIds } });
}
