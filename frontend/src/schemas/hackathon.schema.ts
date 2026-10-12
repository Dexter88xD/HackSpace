import { z } from "zod";

export const hackathonSchema = z.object({
    title: z.string().trim().min(1, "Title is required"),

    description: z.string(),

    organization_name: z
        .string()
        .trim()
        .min(1, "Organization name is required"),

    start_at: z
        .string()
        .min(1, "Start date is required")
        .refine(
            (value) => !Number.isNaN(new Date(value).getTime()),
            "Invalid start date",
        ),

    end_at: z
        .string()
        .min(1, "End date is required")
        .refine(
            (value) => !Number.isNaN(new Date(value).getTime()),
            "Invalid start date",
        ),

}).refine(
    (data) => new Date(data.end_at) > new Date(data.start_at),
    {
        message: "End date must be after start date",
        path: ["end_at"],
    },
);

export type HackathonFormValues = z.infer<typeof hackathonSchema>;