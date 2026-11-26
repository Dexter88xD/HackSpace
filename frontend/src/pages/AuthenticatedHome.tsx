import {
  ArrowRight,
  Compass,
  CalendarDays,
  UserRound,
  Users,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getHackathons } from "@/api/hackathon";
import { HackathonCard } from "@/components/hackathon/HackathonCard";
import { Button, buttonVariants } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { shouldRetryQuery } from "@/lib/query-retry";
import type { AuthenticatedUser } from "@/types/auth";
import { HackathonSortField, SortOrder } from "@/types/hackathon";

const shortcuts = [
  {
    icon: Compass,
    title: "Explore hackathons",
    description: "Find your next challenge.",
    to: "/hackathon-explorer",
  },
  {
    icon: CalendarDays,
    title: "Manage hackathons",
    description: "Create and manage your events.",
    to: "/hackathons",
  },
  {
    icon: UserRound,
    title: "Your profile",
    description: "Keep your profile and skills up to date.",
    to: "/profile",
  },
  {
    icon: Users,
    title: "Friends",
    description: "Connect with other builders.",
    to: "/friends",
  },
];

export default function AuthenticatedHome({
  user,
}: {
  user: AuthenticatedUser;
}) {
  const recentQuery = useQuery({
    queryKey: ["home-recent-hackathons", user.id],
    queryFn: () =>
      getHackathons({
        page: 1,
        limit: 3,
        sortBy: HackathonSortField.CREATED_AT,
        sortOrder: SortOrder.DESC,
      }),
    retry: shouldRetryQuery,
  });

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-4 sm:px-6 sm:py-6 lg:px-8">
      <section className="rounded-xl border bg-muted/40 p-4 sm:p-6">
        <p className="mb-2 text-sm text-muted-foreground">Your HackSpace</p>
        <h1 className="break-words text-2xl font-bold tracking-tight sm:text-3xl">
          Welcome, {user.fullName || user.username}
        </h1>
        <p className="mt-2 max-w-xl text-muted-foreground">
          Discover new challenges, collaborate with your community and manage
          your hackathons.
        </p>
        <Link
          to="/hackathon-explorer"
          className={buttonVariants({ size: "lg", className: "mt-4" })}
        >
          Explore hackathons <ArrowRight aria-hidden="true" />
        </Link>
      </section>
      <section aria-labelledby="shortcuts-heading" className="space-y-3">
        <h2 id="shortcuts-heading" className="text-xl font-semibold">
          Quick actions
        </h2>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {shortcuts.map(({ icon: Icon, title, description, to }) => (
            <div
              key={to}
              className="flex min-w-0 flex-col gap-3 rounded-xl border p-3"
            >
              <div className="flex items-start gap-3">
                <div className="shrink-0 rounded-lg bg-muted p-2">
                  <Icon className="size-5" aria-hidden="true" />
                </div>

                <div className="min-w-0 space-y-1">
                  <h3 className="text-sm font-medium">{title}</h3>

                  <p className="text-xs text-muted-foreground">{description}</p>
                </div>
              </div>

              <Link
                to={to}
                className={buttonVariants({
                  variant: "default",
                  size: "sm",
                  className: "mt-auto w-full",
                })}
              >
                Open <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </div>
          ))}
        </div>
      </section>
      <section aria-labelledby="recent-heading" className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="recent-heading" className="text-xl font-semibold">
            Recently added hackathons
          </h2>
          <Link
            to="/hackathon-explorer"
            className="text-sm font-medium hover:underline"
          >
            View all hackathons
          </Link>
        </div>
        {recentQuery.isPending ? (
          <div className="flex items-center gap-2 py-6">
            <Spinner />
            <p role="status">Loading hackathons...</p>
          </div>
        ) : recentQuery.isError ? (
          <div className="space-y-3 rounded-xl border p-4">
            <p role="alert" className="text-sm text-destructive">
              Couldn't load hackathons.
            </p>
            <Button
              variant="outline"
              disabled={recentQuery.isFetching}
              onClick={() => void recentQuery.refetch()}
            >
              Retry
            </Button>
          </div>
        ) : recentQuery.data.data.length === 0 ? (
          <p className="rounded-xl border p-4 text-sm text-muted-foreground">
            No hackathons available yet.
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {recentQuery.data.data.map((hackathon) => (
              <HackathonCard key={hackathon.id} hackathon={hackathon} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
