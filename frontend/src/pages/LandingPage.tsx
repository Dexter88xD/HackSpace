import { ArrowRight, CalendarDays, Code2, Users, Trophy } from "lucide-react";
import { Link } from "react-router-dom";
import { buttonVariants } from "@/components/ui/button";

const features = [
  {
    icon: CalendarDays,
    title: "Discover hackathons",
    description: "Explore events, find challenges and follow their schedules.",
  },
  {
    icon: Users,
    title: "Build your team",
    description: "Connect with other builders and collaborate on a project.",
  },
  {
    icon: Trophy,
    title: "Bring ideas to life",
    description:
      "Submit your team's work and take part in hackathon evaluations.",
  },
];

export default function LandingPage() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
      <section className="grid items-center gap-6 py-6 sm:py-8 lg:grid-cols-2 lg:gap-10">
        <div className="space-y-4">
          <p className="inline-flex items-center gap-2 rounded-full border bg-muted px-3 py-1 text-sm text-muted-foreground">
            <Code2 className="size-4" aria-hidden="true" /> Built for hackathons
          </p>
          <h1 className="text-4xl font-bold tracking-tight lg:text-5xl">
            Great ideas start with a challenge.
          </h1>
          <p className="max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            HackSpace brings hackathon organisers and builders together.
            Discover challenges, find your team and turn your ideas into real
            projects.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link to="/register" className={buttonVariants({ size: "lg" })}>
              Get started <ArrowRight aria-hidden="true" />
            </Link>
            <Link
              to="/login"
              className={buttonVariants({ variant: "outline", size: "lg" })}
            >
              Log in
            </Link>
          </div>
        </div>
        <div className="rounded-2xl border bg-muted/40 p-4 sm:p-6">
          <p className="mb-4 text-sm font-medium text-muted-foreground">
            From idea to submission
          </p>
          <ol className="space-y-3">
            {features.map(({ icon: Icon, title, description }, index) => (
              <li
                key={title}
                className="flex items-start gap-3 rounded-xl border bg-card p-3"
              >
                <div className="rounded-lg bg-primary p-3 text-primary-foreground">
                  <Icon className="size-5" aria-hidden="true" />
                </div>
                <div className="min-w-0 space-y-1">
                  <p className="text-xs text-muted-foreground">
                    Step 0{index + 1}
                  </p>
                  <h2 className="font-semibold">{title}</h2>
                  <p className="text-sm text-muted-foreground">{description}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>
    </div>
  );
}
