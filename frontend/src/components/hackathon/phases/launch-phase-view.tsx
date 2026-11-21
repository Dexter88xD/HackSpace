import { CalendarDays, Info } from "lucide-react";

type LaunchPhaseViewProps = {
  registrationStartAt: string;
};

export default function LaunchPhaseView({
  registrationStartAt,
}: LaunchPhaseViewProps) {
  const registrationDate = new Date(registrationStartAt).toLocaleString(
    "en-US",
    {
      dateStyle: "medium",
      timeStyle: "short",
    },
  );

  return (
    <section
      aria-labelledby="launch-phase-title"
      className="rounded-xl border border-border p-4 sm:p-6"
    >
      <div className="mb-4">
        <h2 id="launch-phase-title" className="text-lg font-semibold">
          Registration opens soon
        </h2>

        <p className="mt-1 text-sm text-muted-foreground">
          This hackathon is in its launch phase. You can explore the event
          details before registration opens.
        </p>
      </div>

      <div className="flex items-start gap-3">
        <CalendarDays
          className="mt-0.5 size-4 shrink-0 text-muted-foreground"
          aria-hidden="true"
        />

        <div>
          <p className="text-sm font-medium">Registration opens</p>

          <p className="text-sm text-muted-foreground">{registrationDate}</p>
        </div>
      </div>

      <div className="mt-4 flex items-start gap-2 rounded-lg bg-muted p-3">
        <Info
          className="mt-0.5 size-4 shrink-0 text-muted-foreground"
          aria-hidden="true"
        />

        <p className="text-sm text-muted-foreground">
          Registration will become available when the registration phase begins.
        </p>
      </div>
    </section>
  );
}
