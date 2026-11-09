import api from "./client";
import type { Profile } from "@/types/profile";
import type { ProfileFormData } from "@/schemas/profile.schema";

export async function getProfile(): Promise<Profile> {
  const response = await api.get("/users/me/profile");
  return response.data;
}

export async function createProfile(data: ProfileFormData): Promise<Profile> {
  const response = await api.post("/users/me/profile", {
    ...data,
    avatarUrl: data.avatarUrl || null,
  });

  return response.data;
}

export async function updateProfile(data: ProfileFormData): Promise<Profile> {
  const response = await api.patch("/users/me/profile", {
    ...data,
    avatarUrl: data.avatarUrl || null,
  });

  return response.data;
}
