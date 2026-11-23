import { CalendarDays, ClipboardCheck } from "lucide-react";
import type { ReactNode } from "react";

type EvaluationPhaseViewProps = {
  evaluationEndAt: string;
  children?: ReactNode;
};

export default function EvaluationPhaseView({
  evaluationEndAt,
  children,
}: EvaluationPhaseViewProps) {
  const endDate = new Date(evaluationEndAt).toLocaleString("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return (
    <section
      aria-labelledby="evaluation-phase-title"
      className="rounded-xl border border-border p-4 sm:p-6"
    >
      <div className="flex items-start gap-3">
        <ClipboardCheck
          className="mt-1 size-5 shrink-0 text-muted-foreground"
          aria-hidden="true"
        />

        <div>
          <h2 id="evaluation-phase-title" className="text-lg font-semibold">
            Evaluation in progress
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            The jury is evaluating the participating teams. Results will become
            available after the evaluation ends.
          </p>
        </div>
      </div>

      <div className="mt-5 flex items-start gap-3">
        <CalendarDays
          className="mt-0.5 size-4 shrink-0 text-muted-foreground"
          aria-hidden="true"
        />

        <div>
          <p className="text-sm font-medium">Evaluation ends</p>
          <p className="text-sm text-muted-foreground">{endDate}</p>
        </div>
      </div>
      {children && (
        <div className="mt-5 space-y-4 border-t border-border pt-5">
          {children}
        </div>
      )}
    </section>
  );
}
