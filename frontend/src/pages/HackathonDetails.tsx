import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getMe } from "@/api/auth";
import { getHackathonById } from "@/api/hackathon-management";
import { isAxiosError } from "axios";
import HackathonDetailsState from "@/components/hackathon/HackathonDetailsState";
import { Spinner } from "@/components/ui/spinner";
import { buttonVariants } from "@/components/ui/button";
import { shouldRetryQuery } from "@/lib/query-retry";
import { parseHackathonId } from "@/lib/hackathon-id";

export default function HackathonDetails() {
  const { id } = useParams<{ id: string }>();
  const hackathonId = parseHackathonId(id);

  const { data: currentUser } = useQuery({
    queryKey: ["me"],
    queryFn: getMe,
    retry: false,
  });

  const currentUserId = currentUser?.id;

  const {
    data: hackathon,
    isPending,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["hackathons", hackathonId, currentUserId],
    queryFn: () => {
      if (hackathonId === null) {
        throw new Error("Invalid hackathon ID");
      }

      return getHackathonById(hackathonId);
    },
    enabled: currentUserId !== undefined && hackathonId !== null,
    retry: shouldRetryQuery,
  });

  if (hackathonId === null) {
    return <HackathonDetailsState variant="invalid" />;
  }

  if (isPending) {
    return (
      <section
        role="status"
        aria-live="polite"
        className="flex min-h-[60vh] flex-col items-center justify-center gap-4"
      >
        <Spinner />
        <p className="text-sm text-muted-foreground">
          Loading hackathon details...
        </p>
      </section>
    );
  }

  if (isError) {
    if (isAxiosError(error) && error.response?.status === 404) {
      return <HackathonDetailsState variant="not-found" />;
    }

    return (
      <HackathonDetailsState variant="error" onRetry={() => void refetch()} />
    );
  }

  return (
    <section className="mx-auto w-full max-w-4xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">{hackathon.title}</h1>

        <p className="mt-2 text-muted-foreground">
          Organised by {hackathon.organization_name}
        </p>
      </div>

      <div className="grid gap-4 rounded-lg border p-6 sm:grid-cols-2">
        <div>
          <h2 className="font-semibold">Start date</h2>
          <p className="mt-1 text-muted-foreground">
            {new Date(hackathon.start_at).toLocaleString("en-US", {
              dateStyle: "medium",
              timeStyle: "short",
            })}
          </p>
        </div>

        <div>
          <h2 className="font-semibold">End date</h2>
          <p className="mt-1 text-muted-foreground">
            {new Date(hackathon.end_at).toLocaleString("en-US", {
              dateStyle: "medium",
              timeStyle: "short",
            })}
          </p>
        </div>
      </div>

      <div className="mt-8">
        <h2 className="mb-3 text-xl font-semibold">About this hackathon</h2>

        <p className="whitespace-pre-wrap break-words text-muted-foreground">
          {hackathon.description || "No description provided."}
        </p>
      </div>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          to="/hackathon-explorer"
          className={buttonVariants({
            variant: "outline",
            size: "lg",
          })}
        >
          Back to Explorer
        </Link>

        {hackathon.canEdit && (
          <Link
            to={`/hackathons/${hackathon.id}/edit`}
            state={{ returnTo: `/hackathons/${hackathon.id}` }}
            className={buttonVariants({ variant: "default", size: "lg" })}
          >
            Edit Hackathon
          </Link>
        )}
      </div>
    </section>
  );
}
