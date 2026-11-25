import api from "./client";
import type { UserRole } from "@/types/auth";

export interface AdminUser {
  id: number;
  username: string;
  fullName: string;
  email: string;
  role: UserRole;
  createdAt: string;
}

export interface AdminUsersPage {
  data: AdminUser[];
  total: number;
  page: number;
  limit: number;
}

export async function getAdminUsers(params: {
  page: number;
  limit: number;
}): Promise<AdminUsersPage> {
  const response = await api.get<AdminUsersPage>("/admin/users", { params });
  return response.data;
}

export async function updateUserRole(
  userId: number,
  role: UserRole,
): Promise<AdminUser> {
  const response = await api.patch<AdminUser>(`/admin/users/${userId}/role`, {
    role,
  });
  return response.data;
}

export async function deleteUser(userId: number): Promise<void> {
  await api.delete(`/admin/users/${userId}`);
}
