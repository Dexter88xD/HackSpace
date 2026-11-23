import { Trophy } from "lucide-react";
import type { ReactNode } from "react";

type FinishedPhaseViewProps = {
  children?: ReactNode;
};

export default function FinishedPhaseView({
  children,
}: FinishedPhaseViewProps) {
  return (
    <section
      aria-labelledby="finished-phase-title"
      className="rounded-xl border border-border p-4 sm:p-6"
    >
      <div className="flex items-start gap-3">
        <Trophy
          className="mt-1 size-5 shrink-0 text-muted-foreground"
          aria-hidden="true"
        />

        <div>
          <h2 id="finished-phase-title" className="text-lg font-semibold">
            Hackathon finished
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            This hackathon has concluded. Thank you to everyone who
            participated.
          </p>
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
