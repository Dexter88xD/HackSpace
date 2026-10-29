export type UserRole = "ROLE_USER" | "ROLE_ADMIN";

export interface AuthenticatedUser {
    id: number;
    username: string;
    fullName: string;
    email: string;
    emailVerified: boolean;
    role: UserRole;
}
