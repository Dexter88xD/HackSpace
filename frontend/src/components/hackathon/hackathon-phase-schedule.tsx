import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { PHASE_ORDER } from "@/schemas/hackathon.schema";
import {
  HackathonPhaseName,
  type HackathonPhaseResponse,
} from "@/types/hackathon";

type HackathonPhaseScheduleProps = {
  phases: HackathonPhaseResponse[];
  currentPhaseName: HackathonPhaseName | null;
  now: number;
};

const PHASE_LABELS: Record<HackathonPhaseName, string> = {
  LAUNCH: "Launch",
  REGISTRATION: "Registration",
  IN_PROGRESS: "In Progress",
  EVALUATION: "Evaluation",
  FINISHED: "Finished",
};

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export default function HackathonPhaseSchedule({
  phases,
  currentPhaseName,
  now,
}: HackathonPhaseScheduleProps) {
  const orderedPhases = PHASE_ORDER.map((phaseName) =>
    phases.find((phase) => phase.phaseName === phaseName),
  ).filter((phase): phase is HackathonPhaseResponse => phase !== undefined);

  const currentIndex = orderedPhases.findIndex(
    (phase) => phase.phaseName === currentPhaseName,
  );

  return (
    <section
      aria-labelledby="hackathon-schedule-title"
      className="rounded-xl border border-border p-4 sm:p-6"
    >
      <h2 id="hackathon-schedule-title" className="mb-6 text-lg font-semibold">
        Hackathon schedule
      </h2>
      <ol className="grid grid-cols-1 md:grid-cols-5">
        {orderedPhases.map((phase, index) => {
          const isCompleted = now >= new Date(phase.endAt).getTime();

          const isCurrent =
            index === currentIndex &&
            now >= new Date(phase.startAt).getTime() &&
            !isCompleted;
          const isFirst = index === 0;
          const isLast = index === orderedPhases.length - 1;

          return (
            <li
              key={phase.id}
              className="flex min-w-0 gap-3 md:flex-col md:gap-2"
              aria-current={isCurrent ? "step" : undefined}
            >
              <div className="flex w-6 shrink-0 flex-col items-center md:w-full md:flex-row">
                <div
                  className={cn(
                    "hidden h-px flex-1 md:block",
                    isFirst ? "bg-transparent" : "bg-border",
                  )}
                />

                <div
                  className={cn(
                    "z-10 flex size-6 shrink-0 items-center justify-center rounded-full border",
                    isCurrent
                      ? "border-foreground bg-foreground text-background"
                      : "border-border bg-muted text-muted-foreground",
                  )}
                >
                  {isCompleted ? (
                    <Check className="size-3.5" aria-hidden="true" />
                  ) : (
                    <span
                      className={cn(
                        "size-1.5 rounded-full",
                        isCurrent ? "bg-background" : "bg-muted-foreground",
                      )}
                    />
                  )}
                </div>

                <div
                  className={cn(
                    "hidden h-px flex-1 md:block",
                    isLast ? "bg-transparent" : "bg-border",
                  )}
                />

                {!isLast && (
                  <div className="w-px min-h-10 flex-1 bg-border md:hidden" />
                )}
              </div>

              <div className="min-w-0 flex-1 pb-5 md:px-1 md:pb-0 md:text-center">
                <h3 className={cn("text-sm", isCurrent && "font-semibold")}>
                  {PHASE_LABELS[phase.phaseName]}
                </h3>

                <p className="mt-1 text-xs text-muted-foreground">
                  {formatDate(phase.startAt)} – {formatDate(phase.endAt)}
                </p>

                {isCurrent && (
                  <span className="mt-2 inline-block rounded-full bg-muted px-2 py-0.5 text-xs">
                    Current
                  </span>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
