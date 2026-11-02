import { Link } from "react-router-dom";
import { AlertCircle, FileQuestion, ShieldAlert } from "lucide-react";
import type { HackathonDetailsStateProps } from "@/types/hackathon-management";

const stateConfig = {
  invalid: {
    icon: ShieldAlert,
    title: "Invalid hackathon ID",
    description: "The link you followed contains an invalid hackathon ID.",
  },
  "not-found": {
    icon: FileQuestion,
    title: "Hackathon not found",
    description:
      "The hackathon you're looking for doesn't exist or may have been removed.",
  },
  error: {
    icon: AlertCircle,
    title: "Unable to load hackathon",
    description:
      "Something went wrong while loading the details. Please try again.",
  },
  forbidden: {
    icon: ShieldAlert,
    title: "Access denied",
    description: "You don't have permission to edit this hackathon.",
  },
};

export default function HackathonDetailsState({
  variant,
  onRetry,
}: HackathonDetailsStateProps) {
  const { icon: Icon, title, description } = stateConfig[variant];

  return (
    <section className="mx-auto flex min-h-[60vh] max-w-2xl items-center justify-center px-4 py-12">
      <div
        role="alert"
        className="w-full rounded-xl border bg-card px-6 py-12 text-center shadow-sm"
      >
        <div className="mx-auto mb-5 flex size-16 items-center justify-center rounded-full bg-muted">
          <Icon className="size-8 text-muted-foreground" aria-hidden="true" />
        </div>

        <h1 className="text-2xl font-semibold">{title}</h1>

        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-muted-foreground">
          {description}
        </p>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            to="/hackathon-explorer"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            Back to Explorer
          </Link>

          {variant === "error" && onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              Try Again
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
