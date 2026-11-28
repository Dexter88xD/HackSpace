import { Trophy } from "lucide-react";

export default function FinishedPhaseView() {
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
    </section>
  );
}
