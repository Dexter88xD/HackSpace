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
import ConfirmButton from "@/components/team/ConfirmButton";
import JoinRequestList from "@/components/team/JoinRequestList";
import TeamDetails from "@/components/team/TeamDetails";
import TeamList from "@/components/team/TeamList";
import HackathonDetailsState from "@/components/hackathon/HackathonDetailsState";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
    // Check again every 4 seconds, so members, joins and leaves show up
    // without reloading the page.
    refetchInterval: 4000,
  });

  const { data: currentUser } = useQuery({
    queryKey: ["me"],
    queryFn: getMe,
  });

  const team = data?.team ?? null;
  const isLeader = team !== null && team.leaderId === currentUser?.id;

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
    queryFn: () => {
      if (team === null) {
        throw new Error("No team");
      }

      return getJoinRequests(team.id);
    },
    enabled: isLeader,
    retry: shouldRetryQuery,
    refetchInterval: 4000,
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

  // The error of the action that failed, shown once at the top of the page.
  const failedAction = [
    mutation,
    requestMutation,
    cancelMutation,
    acceptMutation,
    rejectMutation,
    removeMutation,
    updateMutation,
    deleteMutation,
    leaveMutation,
  ].find((action) => action.isError);

  return (
    <section className="mx-auto w-full max-w-4xl space-y-6 px-4 py-8">
      <Link
        to={`/hackathons/${hackathonId}`}
        className="text-sm text-muted-foreground hover:underline"
      >
        ← Back to hackathon
      </Link>

      <h1 className="text-3xl font-bold">
        {team ? "Your team" : "Join or create a team"}
      </h1>

      {failedAction && (
        <p role="alert" className="text-sm text-destructive">
          {errorMessage(failedAction.error, "Something went wrong.")}
        </p>
      )}

      {team ? (
        <>
          {isEditing ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-xl font-semibold">
                  Edit team
                </CardTitle>
                <CardAction>
                  <Button variant="ghost" onClick={() => setIsEditing(false)}>
                    Cancel
                  </Button>
                </CardAction>
              </CardHeader>
              <CardContent>
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
              </CardContent>
            </Card>
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
              actions={
                <>
                  {isLeader && (
                    <Button
                      variant="outline"
                      onClick={() => setIsEditing(true)}
                    >
                      Edit
                    </Button>
                  )}
                  {isLeader && (
                    <ConfirmButton
                      label="Delete"
                      title="Delete this team?"
                      description="All members will be removed. This cannot be undone."
                      confirmLabel="Delete"
                      onConfirm={() => deleteMutation.mutate(team.id)}
                      isPending={deleteMutation.isPending}
                    />
                  )}
                  <ConfirmButton
                    label="Leave"
                    title="Leave this team?"
                    description={
                      isLeader
                        ? "The next oldest member becomes leader. If you are the last member, the team will be deleted."
                        : "If you are the last member, the team will be deleted."
                    }
                    confirmLabel="Leave"
                    onConfirm={() => leaveMutation.mutate(team.id)}
                    isPending={leaveMutation.isPending}
                  />
                </>
              }
            />
          )}

          {isLeader && (
            <Card>
              <CardHeader>
                <CardTitle className="text-xl font-semibold">
                  Join requests
                </CardTitle>
                <CardDescription>
                  Participants asking to join your team.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingRequests ? (
                  <Spinner />
                ) : isRequestsError ? (
                  <p role="alert" className="text-destructive">
                    Failed to load join requests.
                  </p>
                ) : (
                  <JoinRequestList
                    requests={joinRequests}
                    onAccept={(requestId) => acceptMutation.mutate(requestId)}
                    onReject={(requestId) => rejectMutation.mutate(requestId)}
                    isBusy={
                      acceptMutation.isPending || rejectMutation.isPending
                    }
                  />
                )}
              </CardContent>
            </Card>
          )}
        </>
      ) : (
        <div className="grid items-start gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl font-semibold">Teams</CardTitle>
              <CardDescription>
                Ask to join a team. Its leader accepts or rejects you.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TeamList
                teams={teams ?? []}
                myRequests={myRequests ?? []}
                onRequest={(teamId) => requestMutation.mutate(teamId)}
                onCancel={(requestId) => cancelMutation.mutate(requestId)}
                isBusy={requestMutation.isPending || cancelMutation.isPending}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-xl font-semibold">
                Create a team
              </CardTitle>
              <CardDescription>You will be its leader.</CardDescription>
            </CardHeader>
            <CardContent>
              <CreateTeamForm
                onSubmit={(values) => mutation.mutate(values)}
                isSubmitting={mutation.isPending}
              />
            </CardContent>
          </Card>
        </div>
      )}
    </section>
  );
}
