import { z } from "zod";

export const teamSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Team name is required")
    .max(50, "Team name must be 50 characters or less"),

  description: z
    .string()
    .max(500, "Description must be 500 characters or less"),
});

export type TeamFormValues = z.infer<typeof teamSchema>;
