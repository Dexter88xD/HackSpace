import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import {
  acceptJoinRequest,
  cancelJoinRequest,
  createTeam,
  deleteTeam,
  getJoinRequests,
  getMyJoinRequests,
  getMyTeam,
  getTeams,
  leaveTeam,
  rejectJoinRequest,
  removeMember,
  requestToJoin,
  updateTeam,
} from "@/api/team";
import { getMe } from "@/api/auth";
import CreateTeamForm from "@/components/team/CreateTeamForm";
import JoinRequestList from "@/components/team/JoinRequestList";
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
import type { Team } from "@/types/team";

function errorMessage(error: unknown, fallback: string) {
  return isAxiosError(error)
    ? (error.response?.data?.message?.toString() ?? fallback)
    : fallback;
}

function toPayload(values: TeamFormValues) {
  return {
    name: values.name,
    description: values.description.trim() || null,
  };
}

export default function HackathonTeam() {
  const { id } = useParams<{ id: string }>();
  const hackathonId = parseHackathonId(id);
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);

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

  const { data: currentUser } = useQuery({
    queryKey: ["me"],
    queryFn: getMe,
  });

  const team = data?.team ?? null;
  const isLeader = !!team && team.leaderId === currentUser?.id;

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

  const { data: myRequests } = useQuery({
    queryKey: ["my-join-requests", hackathonId],
    queryFn: () => {
      if (hackathonId === null) {
        throw new Error("Invalid hackathon ID");
      }

      return getMyJoinRequests(hackathonId);
    },
    enabled: hackathonId !== null && data?.team === null,
    retry: shouldRetryQuery,
  });

  const {
    data: joinRequests,
    isPending: isLoadingRequests,
    isError: isRequestsError,
  } = useQuery({
    queryKey: ["join-requests", team?.id],
    queryFn: () => getJoinRequests(team!.id),
    enabled: isLeader,
    retry: shouldRetryQuery,
  });

  // Saves the team returned by the backend and refreshes the lists.
  const showTeam = (newTeam: Team | null) => {
    queryClient.setQueryData(["my-team", hackathonId], { team: newTeam });
    queryClient.invalidateQueries({ queryKey: ["teams", hackathonId] });
  };

  const requestMutation = useMutation({
    mutationFn: (teamId: number) => requestToJoin(teamId),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: ["my-join-requests", hackathonId],
      }),
  });

  const cancelMutation = useMutation({
    mutationFn: (requestId: number) => cancelJoinRequest(requestId),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: ["my-join-requests", hackathonId],
      }),
  });

  const acceptMutation = useMutation({
    mutationFn: (requestId: number) => acceptJoinRequest(requestId),
    onSuccess: (newTeam) => showTeam(newTeam),
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: ["join-requests", team?.id] }),
  });

  const rejectMutation = useMutation({
    mutationFn: (requestId: number) => rejectJoinRequest(requestId),
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: ["join-requests", team?.id] }),
  });

  const removeMutation = useMutation({
    mutationFn: ({ teamId, userId }: { teamId: number; userId: number }) =>
      removeMember(teamId, userId),
    onSuccess: (newTeam) => showTeam(newTeam),
  });

  const updateMutation = useMutation({
    mutationFn: ({
      teamId,
      values,
    }: {
      teamId: number;
      values: TeamFormValues;
    }) => updateTeam(teamId, toPayload(values)),
    onSuccess: (newTeam) => {
      showTeam(newTeam);
      setIsEditing(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (teamId: number) => deleteTeam(teamId),
    onSuccess: () => showTeam(null),
  });

  const leaveMutation = useMutation({
    mutationFn: (teamId: number) => leaveTeam(teamId),
    onSuccess: () => showTeam(null),
  });

  const mutation = useMutation({
    mutationFn: (values: TeamFormValues) => {
      if (hackathonId === null) {
        throw new Error("Invalid hackathon ID");
      }

      return createTeam(hackathonId, toPayload(values));
    },
    onSuccess: (newTeam) => showTeam(newTeam),
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

  const memberError = removeMutation.isError
    ? errorMessage(removeMutation.error, "Failed to remove member.")
    : leaveMutation.isError
      ? errorMessage(leaveMutation.error, "Failed to leave team.")
      : deleteMutation.isError
        ? errorMessage(deleteMutation.error, "Failed to delete team.")
        : null;

  const requestError = acceptMutation.isError
    ? errorMessage(acceptMutation.error, "Failed to accept request.")
    : rejectMutation.isError
      ? errorMessage(rejectMutation.error, "Failed to reject request.")
      : null;

  const listError = requestMutation.isError
    ? errorMessage(requestMutation.error, "Failed to send request.")
    : cancelMutation.isError
      ? errorMessage(cancelMutation.error, "Failed to cancel request.")
      : null;

  return (
    <section className="mx-auto w-full max-w-3xl px-4 py-8">
      <h1 className="mb-6 text-3xl font-bold">
        {team ? "Your team" : "Join or create a team"}
      </h1>

      {team ? (
        <>
          {isEditing ? (
            <>
              {updateMutation.isError && (
                <p role="alert" className="mb-4 text-sm text-destructive">
                  {errorMessage(updateMutation.error, "Failed to update team.")}
                </p>
              )}
              <CreateTeamForm
                defaultValues={{
                  name: team.name,
                  description: team.description ?? "",
                }}
                submitLabel="Save"
                onSubmit={(values) =>
                  updateMutation.mutate({ teamId: team.id, values })
                }
                isSubmitting={updateMutation.isPending}
              />
              <div className="mt-2 flex justify-end">
                <Button variant="ghost" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
              </div>
            </>
          ) : (
            <TeamDetails
              team={team}
              onRemove={
                isLeader
                  ? (userId) =>
                      removeMutation.mutate({ teamId: team.id, userId })
                  : undefined
              }
              isRemoving={removeMutation.isPending}
            />
          )}

          {memberError && (
            <p role="alert" className="mt-4 text-sm text-destructive">
              {memberError}
            </p>
          )}

          <div className="mt-4 flex flex-wrap justify-end gap-2">
            {isLeader && !isEditing && (
              <Button
                variant="outline"
                size="lg"
                onClick={() => setIsEditing(true)}
              >
                Edit Team
              </Button>
            )}

            {isLeader && (
              <AlertDialog>
                <AlertDialogTrigger
                  render={<Button variant="outline" size="lg" />}
                >
                  Delete Team
                </AlertDialogTrigger>

                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete this team?</AlertDialogTitle>
                    <AlertDialogDescription>
                      All members will be removed. This cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>

                  <AlertDialogCancel>Cancel</AlertDialogCancel>

                  <AlertDialogAction
                    render={
                      <Button
                        variant="default"
                        size="lg"
                        disabled={deleteMutation.isPending}
                        onClick={() => deleteMutation.mutate(team.id)}
                      />
                    }
                  >
                    {deleteMutation.isPending ? "Deleting..." : "Delete"}
                  </AlertDialogAction>
                </AlertDialogContent>
              </AlertDialog>
            )}

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
                    {isLeader
                      ? "The next oldest member becomes leader. If you are the last member, the team will be deleted."
                      : "If you are the last member, the team will be deleted."}
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

          {isLeader && (
            <>
              <h2 className="mt-8 mb-3 text-xl font-semibold">Join requests</h2>

              {requestError && (
                <p role="alert" className="mb-4 text-sm text-destructive">
                  {requestError}
                </p>
              )}

              {isLoadingRequests ? (
                <Spinner />
              ) : isRequestsError ? (
                <p role="alert" className="text-sm text-destructive">
                  Failed to load join requests.
                </p>
              ) : (
                <JoinRequestList
                  requests={joinRequests}
                  onAccept={(requestId) => acceptMutation.mutate(requestId)}
                  onReject={(requestId) => rejectMutation.mutate(requestId)}
                  isBusy={acceptMutation.isPending || rejectMutation.isPending}
                />
              )}
            </>
          )}
        </>
      ) : (
        <>
          <h2 className="mb-3 text-xl font-semibold">Teams</h2>

          {listError && (
            <p role="alert" className="mb-4 text-sm text-destructive">
              {listError}
            </p>
          )}

          <TeamList
            teams={teams ?? []}
            myRequests={myRequests ?? []}
            onRequest={(teamId) => requestMutation.mutate(teamId)}
            onCancel={(requestId) => cancelMutation.mutate(requestId)}
            isBusy={requestMutation.isPending || cancelMutation.isPending}
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
