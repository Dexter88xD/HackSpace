import { CalendarDays } from "lucide-react";

type RegistrationPhaseViewProps = {
  registrationEndAt: string;
  children: React.ReactNode;
};

export default function RegistrationPhaseView({
  registrationEndAt,
  children,
}: RegistrationPhaseViewProps) {
  const registrationDate = new Date(registrationEndAt).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return (
    <section
      aria-labelledby="registration-phase-title"
      className="rounded-xl border border-border p-4 sm:p-6"
    >
      <div>
        <h2 id="registration-phase-title" className="text-lg font-semibold">
          Registration is open
        </h2>

        <p className="mt-1 text-sm text-muted-foreground">
          Registration is currently open. Join this hackathon to participate and
          manage your team.
        </p>
      </div>

      <div className="mt-4 flex items-start gap-3">
        <CalendarDays
          className="mt-0.5 size-4 shrink-0 text-muted-foreground"
          aria-hidden="true"
        />

        <div>
          <p className="text-sm font-medium">Registration closes</p>
          <p className="text-sm text-muted-foreground">{registrationDate}</p>
        </div>
      </div>

      <div className="mt-4 border-t border-border pt-4">{children}</div>
    </section>
  );
}
