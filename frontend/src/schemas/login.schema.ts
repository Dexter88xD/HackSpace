import { z } from "zod";

export const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(1, {error: "Password is required"}),
});

export type LoginFormData = z.infer<typeof loginSchema>;