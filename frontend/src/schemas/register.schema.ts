import { z } from "zod";

export const registerSchema = z
  .object({
    username: z.string().min(3, {
      error: "Username must be at least 3 characters",
    }),

    fullName: z.string().min(1, {
      error: "Full Name is required",
    }),

    email: z.email({
      error: "Please enter a valid email address",
    }),

    password: z
      .string()
      .min(8, {
        error: "Password must be at least 8 characters",
      })
      .regex(/[a-z]/, {
        error: "Password must contain a lowercase letter",
      })
      .regex(/[A-Z]/, {
        error: "Password must contain an uppercase letter",
      })
      .regex(/[0-9]/, {
        error: "Password must contain a number",
      })
      .regex(/[^A-Za-z0-9]/, {
        error: "Password must contain a special character",
      }),

    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    error: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type RegisterFormData = z.infer<typeof registerSchema>;
