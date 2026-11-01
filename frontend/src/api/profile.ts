import api from "./client";
import type { Profile, ProfileInput } from "../types/profile";

export async function getProfile(): Promise<Profile> {
	const response = await api.get<Profile>("/users/me/profile");
	return response.data;
}

export async function createProfile(data: {
	bio?: string;
	avatar_url?: string;
	organization_name?: string;
	major?: string;
}): Promise<Profile> {
	const response = await api.post("/users/me/profile", data);
	return response.data;
}

export async function updateProfile(data: ProfileInput): Promise<Profile> {
	const response = await api.patch<Profile>("/users/me/profile", data);
	return response.data;
}
