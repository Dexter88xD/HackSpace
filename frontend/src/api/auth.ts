import { RegisterFormData } from "@/schemas/register.schema";
import api from "./client";
import { VerificationFormData } from "@/schemas/verification.schema";
import { LoginFormData } from "@/schemas/login.schema";
import { AuthenticatedUser } from "@/types/auth";

export const register = async (data: RegisterFormData) => {
    const response = await api.post('/auth/register', data);
    return response.data;
}

export const verify = async (data: VerificationFormData) => {
    const response = await api.post('/auth/verify', data);
    return response.data;
}

export const login = async (data: LoginFormData) => {
    const response = await api.post('/auth/signin', data);
    return response.data;
}

export const resend = async (email: string) => {
    const response = await api.post('/auth/resend-code', { email });
    return response.data;
}

export async function getMe(): Promise<AuthenticatedUser> {
    const response = await api.get<AuthenticatedUser>('/auth/me');
    return response.data;
}
