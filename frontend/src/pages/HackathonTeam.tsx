import { Link, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import {
  createTeam,
  getMyTeam,
  getTeams,
  joinTeam,
  leaveTeam,
} from "@/api/team";
import CreateTeamForm from "@/components/team/CreateTeamForm";
import TeamDetails from "@/components/team/TeamDetails";
import TeamList from "@/components/team/TeamList";
import HackathonDetailsState from "@/components/hackathon/HackathonDetailsState";
import { Spinner } from "@/components/ui/spinner";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { parseHackathonId } from "@/lib/hackathon-id";
import { shouldRetryQuery } from "@/lib/query-retry";
import type { TeamFormValues } from "@/schemas/team.schema";

function errorMessage(error: unknown, fallback: string) {
  return isAxiosError(error)
    ? (error.response?.data?.message?.toString() ?? fallback)
    : fallback;
}

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

  const { data: teams } = useQuery({
    queryKey: ["teams", hackathonId],
    queryFn: () => {
      if (hackathonId === null) {
        throw new Error("Invalid hackathon ID");
      }

      return getTeams(hackathonId);
    },
    enabled: hackathonId !== null && data?.team === null,
    retry: shouldRetryQuery,
  });

  const joinMutation = useMutation({
    mutationFn: (teamId: number) => joinTeam(teamId),
    onSuccess: (team) => {
      queryClient.setQueryData(["my-team", hackathonId], { team });
      queryClient.invalidateQueries({ queryKey: ["teams", hackathonId] });
    },
  });

  const leaveMutation = useMutation({
    mutationFn: (teamId: number) => leaveTeam(teamId),
    onSuccess: () => {
      queryClient.setQueryData(["my-team", hackathonId], { team: null });
      queryClient.invalidateQueries({ queryKey: ["teams", hackathonId] });
    },
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
      queryClient.invalidateQueries({ queryKey: ["teams", hackathonId] });
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

  const team = data.team;

  return (
    <section className="mx-auto w-full max-w-3xl px-4 py-8">
      <h1 className="mb-6 text-3xl font-bold">
        {team ? "Your team" : "Join or create a team"}
      </h1>

      {team ? (
        <>
          <TeamDetails team={team} />

          {leaveMutation.isError && (
            <p role="alert" className="mt-4 text-sm text-destructive">
              {errorMessage(leaveMutation.error, "Failed to leave team.")}
            </p>
          )}

          <div className="mt-4 flex justify-end">
            <AlertDialog>
              <AlertDialogTrigger
                render={<Button variant="outline" size="lg" />}
              >
                Leave Team
              </AlertDialogTrigger>

              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Leave this team?</AlertDialogTitle>
                  <AlertDialogDescription>
                    If you are the last member, the team will be deleted.
                  </AlertDialogDescription>
                </AlertDialogHeader>

                <AlertDialogCancel>Cancel</AlertDialogCancel>

                <AlertDialogAction
                  render={
                    <Button
                      variant="default"
                      size="lg"
                      disabled={leaveMutation.isPending}
                      onClick={() => leaveMutation.mutate(team.id)}
                    />
                  }
                >
                  {leaveMutation.isPending ? "Leaving..." : "Leave"}
                </AlertDialogAction>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </>
      ) : (
        <>
          <h2 className="mb-3 text-xl font-semibold">Teams</h2>

          {joinMutation.isError && (
            <p role="alert" className="mb-4 text-sm text-destructive">
              {errorMessage(joinMutation.error, "Failed to join team.")}
            </p>
          )}

          <TeamList
            teams={teams ?? []}
            onJoin={(teamId) => joinMutation.mutate(teamId)}
            isJoining={joinMutation.isPending}
          />

          <h2 className="mt-8 mb-3 text-xl font-semibold">Create a team</h2>

          {mutation.isError && (
            <p role="alert" className="mb-4 text-sm text-destructive">
              {errorMessage(mutation.error, "Failed to create team.")}
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
