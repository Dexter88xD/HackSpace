import { z } from "zod";

export const hackathonSchema = z.object({
    title: z.string().trim().min(1, "Title is required"),

    description: z.string(),

    organizationName: z
        .string()
        .trim()
        .min(1, "Organization name is required"),

    startAt: z
        .string()
        .min(1, "Start date is required")
        .refine(
            (value) => !Number.isNaN(new Date(value).getTime()),
            "Invalid start date",
        ),

    endAt: z
        .string()
        .min(1, "End date is required")
        .refine(
            (value) => !Number.isNaN(new Date(value).getTime()),
            "Invalid end date",
        ),

}).refine(
    (data) => new Date(data.endAt) > new Date(data.startAt),
    {
        message: "End date must be after start date",
        path: ["endAt"],
    },
);

export type HackathonFormValues = z.infer<typeof hackathonSchema>;