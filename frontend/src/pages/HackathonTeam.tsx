import { Link, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { createTeam, getMyTeam } from "@/api/team";
import CreateTeamForm from "@/components/team/CreateTeamForm";
import TeamDetails from "@/components/team/TeamDetails";
import HackathonDetailsState from "@/components/hackathon/HackathonDetailsState";
import { Spinner } from "@/components/ui/spinner";
import { buttonVariants } from "@/components/ui/button";
import { parseHackathonId } from "@/lib/hackathon-id";
import { shouldRetryQuery } from "@/lib/query-retry";
import type { TeamFormValues } from "@/schemas/team.schema";

export default function HackathonTeam() {
  const { id } = useParams<{ id: string }>();
  const hackathonId = parseHackathonId(id);
  const queryClient = useQueryClient();

  const { data, isPending, isError, error, refetch } = useQuery({
    queryKey: ["my-team", hackathonId],
    queryFn: () => {
      if (hackathonId === null) {
        throw new Error("Invalid hackathon ID");
      }

      return getMyTeam(hackathonId);
    },
    enabled: hackathonId !== null,
    retry: shouldRetryQuery,
  });

  const mutation = useMutation({
    mutationFn: (values: TeamFormValues) => {
      if (hackathonId === null) {
        throw new Error("Invalid hackathon ID");
      }

      return createTeam(hackathonId, {
        name: values.name,
        description: values.description.trim() || null,
      });
    },
    onSuccess: (team) => {
      queryClient.setQueryData(["my-team", hackathonId], { team });
    },
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
        <p className="text-sm text-muted-foreground">Loading your team...</p>
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
    <section className="mx-auto w-full max-w-3xl px-4 py-8">
      <h1 className="mb-6 text-3xl font-bold">
        {data.team ? "Your team" : "Create a team"}
      </h1>

      {data.team ? (
        <TeamDetails team={data.team} />
      ) : (
        <>
          {mutation.isError && (
            <p role="alert" className="mb-4 text-sm text-destructive">
              {isAxiosError(mutation.error)
                ? (mutation.error.response?.data?.message?.toString() ??
                  "Failed to create team.")
                : "Failed to create team."}
            </p>
          )}

          <CreateTeamForm
            onSubmit={(values) => mutation.mutate(values)}
            isSubmitting={mutation.isPending}
          />
        </>
      )}

      <div className="mt-8">
        <Link
          to={`/hackathons/${hackathonId}`}
          className={buttonVariants({ variant: "outline", size: "lg" })}
        >
          Back to Hackathon
        </Link>
      </div>
    </section>
  );
}
