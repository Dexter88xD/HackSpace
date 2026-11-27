import api from "./client";

export interface PublicUser {
  id: number;
  username: string;
  fullName: string;
  bio: string | null;
  major: string | null;
  organizationName: string | null;
  avatarUrl: string | null;
  skills: string[];
}

export async function getPublicProfile(userId: number): Promise<PublicUser> {
  const response = await api.get<PublicUser>(`/users/${userId}/public`);

  return response.data;
}

export interface SearchUser {
  id: number;
  username: string;
  fullName: string;
}

export async function searchUsers(query: string): Promise<SearchUser[]> {
  const response = await api.get<SearchUser[]>("/users/search", {
    params: { q: query },
  });

  return response.data;
}
