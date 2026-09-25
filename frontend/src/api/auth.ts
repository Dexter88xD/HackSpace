import { RegisterFormData } from "@/schemas/register.schema";
import api from "./client";
import { VerificationFormData } from "@/schemas/verification.schema";
import { LoginFormData } from "@/schemas/login.schema";

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
    console.log("test")
    const response = await api.post('/auth/resend-code', {email});
    return response.data;
}

export async function getMe() {
  const token = localStorage.getItem('accessToken');

  const response = await api.get('/auth/me', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.data;
}