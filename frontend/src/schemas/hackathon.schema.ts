import { z } from "zod";

export const PHASE_ORDER = [
  "LAUNCH",
  "REGISTRATION",
  "IN_PROGRESS",
  "EVALUATION",
  "FINISHED",
] as const;

const dateField = (label: string) =>
  z
    .string()
    .min(1, `${label} is required`)
    .refine(
      (value) => Number.isFinite(new Date(value).getTime()),
      `Invalid ${label.toLowerCase()}`,
    );

export const hackathonPhaseSchema = z.object({
  phaseName: z.enum(PHASE_ORDER),
  description: z.string(),
  startAt: dateField("Phase start date"),
  endAt: dateField("Phase end date"),
});

export const hackathonSchema = z
  .object({
    title: z.string().trim().min(1, "Title is required"),

    description: z.string(),

    organizationName: z.string().trim().min(1, "Organization name is required"),

    startAt: dateField("Start date"),
    endAt: dateField("End date"),

    phases: z
      .array(hackathonPhaseSchema)
      .length(5, "A hackathon must contain exactly five phases"),
  })
  .superRefine((data, ctx) => {
    const hackathonStart = new Date(data.startAt).getTime();
    const hackathonEnd = new Date(data.endAt).getTime();

    const validHackathonDates =
      Number.isFinite(hackathonStart) && Number.isFinite(hackathonEnd);

    if (validHackathonDates && hackathonStart >= hackathonEnd) {
      ctx.addIssue({
        code: "custom",
        message: "End date must be after start date",
        path: ["endAt"],
      });
    }

    for (let i = 0; i < data.phases.length; i++) {
      const phase = data.phases[i];

      const phaseStart = new Date(phase.startAt).getTime();
      const phaseEnd = new Date(phase.endAt).getTime();

      const validPhaseDates =
        Number.isFinite(phaseStart) && Number.isFinite(phaseEnd);

      if (phase.phaseName !== PHASE_ORDER[i]) {
        ctx.addIssue({
          code: "custom",
          message: `Expected ${PHASE_ORDER[i]} at position ${i + 1}`,
          path: ["phases", i, "phaseName"],
        });
      }

      if (!validPhaseDates) {
        continue;
      }

      // Each phase must have a positive duration.
      if (phaseStart >= phaseEnd) {
        ctx.addIssue({
          code: "custom",
          message: "Phase end date must be after its start date",
          path: ["phases", i, "endAt"],
        });
      }

      // A phase cannot start before the hackathon.
      if (validHackathonDates && phaseStart < hackathonStart) {
        ctx.addIssue({
          code: "custom",
          message: "Phase cannot start before the hackathon",
          path: ["phases", i, "startAt"],
        });
      }

      // A phase cannot end after the hackathon.
      if (validHackathonDates && phaseEnd > hackathonEnd) {
        ctx.addIssue({
          code: "custom",
          message: "Phase cannot end after the hackathon",
          path: ["phases", i, "endAt"],
        });
      }

      // Compare with the preceding phase to detect overlaps.
      if (i > 0) {
        const previousEnd = new Date(data.phases[i - 1].endAt).getTime();

        if (Number.isFinite(previousEnd) && phaseStart < previousEnd) {
          ctx.addIssue({
            code: "custom",
            message: "Phase overlaps with the previous phase",
            path: ["phases", i, "startAt"],
          });
        }
      }
    }
  });

export type HackathonFormValues = z.infer<typeof hackathonSchema>;
