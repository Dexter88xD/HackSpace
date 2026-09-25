import { email, z } from "zod";

export const verificationSchema = z.object({
  email: z.email(),
  otp: z.string().length(6, "Verification code must be 6 digits"),
});

export type VerificationFormData = z.infer<typeof verificationSchema>;