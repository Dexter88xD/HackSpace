
import { z } from "zod";

export const profileSchema = z.object({
  bio: z.string().max(500, "Bio must be at most 500 characters"),
  organization_name: z.string().max(100, "Organization is too long"),
  major: z.string().max(100, "Major is too long"),
  avatar_url: z.union([
    z.literal(""),
    z.url("Enter a valid image URL"),
  ]),
});

export type ProfileFormData = z.infer<typeof profileSchema>;
