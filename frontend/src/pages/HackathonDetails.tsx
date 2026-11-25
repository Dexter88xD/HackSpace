import { Link, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getMe } from "@/api/auth";
import { getHackathonById } from "@/api/hackathon-management";
import { isAxiosError } from "axios";
import HackathonDetailsState from "@/components/hackathon/HackathonDetailsState";
import { Spinner } from "@/components/ui/spinner";
import { Button, buttonVariants } from "@/components/ui/button";
import { shouldRetryQuery } from "@/lib/query-retry";
import { parseHackathonId } from "@/lib/hackathon-id";
import {
  getHackathonCurrentPhase,
  getHackathonMembership,
  hackathonRegister,
  hackathonUnregister,
} from "@/api/hackathon";
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
import { HackathonPhaseName, HackathonRoleName } from "@/types/hackathon";
import { JuryManagement } from "@/components/jury/JuryManagement";
import { JudgeManagement } from "@/components/jury/JudgeManagement";
import { ScoringCriteriaManagement } from "@/components/jury/ScoringCriteriaManagement";
import { JuryEvaluation } from "@/components/jury/JuryEvaluation";
import { HackathonRankings } from "@/components/jury/HackathonRankings";
import { useEffect, useState } from "react";

export default function HackathonDetails() {
  const { id } = useParams<{ id: string }>();
  const hackathonId = parseHackathonId(id);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(Date.now());
    }, 10000);

    return () => window.clearInterval(timer);
  }, []);

  const { data: currentUser } = useQuery({
    queryKey: ["me"],
    queryFn: getMe,
    retry: false,
  });

  const queryClient = useQueryClient();

  const registerMutation = useMutation({
    mutationFn: async () => {
      if (hackathonId === null) {
        throw new Error("Invalid hackathon ID");
      }
      return hackathonRegister(hackathonId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["registration", hackathonId],
      });
    },
  });

  const unregisterMutation = useMutation({
    mutationFn: async () => {
      if (hackathonId === null) {
        throw new Error("Invalid hackathon ID");
      }
      return hackathonUnregister(hackathonId);
    },

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["registration", hackathonId],
      });
      // Unregistering also removes the user from their team.
      queryClient.invalidateQueries({ queryKey: ["my-team", hackathonId] });
    },
  });

  const currentUserId = currentUser?.id;

  const {
    data: membership,
    isPending: isMembershipPending,
    isError: isMembershipError,
    isSuccess: isMembershipSuccess,
    refetch: refetchMembership,
  } = useQuery({
    queryKey: ["registration", hackathonId],
    queryFn: () => {
      if (hackathonId === null) {
        throw new Error("Invalid hackathon ID");
      }
      return getHackathonMembership(hackathonId);
    },
    enabled: hackathonId !== null,
    retry: shouldRetryQuery,
  });

  const { data: currentPhase } = useQuery({
    queryKey: ["phase", hackathonId],
    refetchInterval: 10000,
    queryFn: () => {
      if (hackathonId === null) throw new Error("Invalid hackathon ID");

      return getHackathonCurrentPhase(hackathonId);
    },
    enabled: hackathonId !== null,
    retry: shouldRetryQuery,
  });

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

  const phaseName = currentPhase?.phaseName;

  const evaluationPhase = hackathon.phases.find(
    (phase) => phase.phaseName === HackathonPhaseName.EVALUATION,
  );

  const evaluationStarted =
    evaluationPhase !== undefined &&
    now >= new Date(evaluationPhase.startAt).getTime();

  const evaluationEnded =
    evaluationPhase !== undefined &&
    now >= new Date(evaluationPhase.endAt).getTime();

  const canManageJury =
    hackathon.canEdit && evaluationPhase !== undefined && !evaluationStarted;

  const isEvaluationOpen =
    phaseName === HackathonPhaseName.EVALUATION && !evaluationEnded;

  const canEvaluate =
    isEvaluationOpen && membership?.role === HackathonRoleName.JURY;

  const canViewRankings =
    evaluationEnded || (hackathon.canEdit && isEvaluationOpen);

  const phaseLabels: Record<HackathonPhaseName, string> = {
    [HackathonPhaseName.LAUNCH]: "Launch",
    [HackathonPhaseName.REGISTRATION]: "Registration",
    [HackathonPhaseName.IN_PROGRESS]: "In progress",
    [HackathonPhaseName.EVALUATION]: "Evaluation",
    [HackathonPhaseName.FINISHED]: "Finished",
  };

  const hasPrimaryContent = canManageJury || canEvaluate || canViewRankings;

  return (
    <section className="mx-auto w-full max-w-7xl space-y-5 px-4 py-5 sm:px-6 lg:px-8">
      <header className="space-y-3 border-b pb-4">
        <Link
          to="/hackathon-explorer"
          className="inline-flex text-sm text-muted-foreground hover:text-foreground hover:underline"
        >
          ← Back to Explorer
        </Link>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="break-words text-2xl font-bold sm:text-3xl">
                {hackathon.title}
              </h1>
              <span className="rounded-full border bg-muted px-3 py-1 text-xs font-medium">
                {phaseName ? phaseLabels[phaseName] : "Phase unavailable"}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              Organised by {hackathon.organizationName}
            </p>
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-2">
            {membership?.role === HackathonRoleName.PARTICIPANT && (
              <Link
                to={`/hackathons/${hackathon.id}/team`}
                className={buttonVariants({
                  variant: "default",
                  size: "default",
                })}
              >
                My Team
              </Link>
            )}

            {hackathon.canEdit && (
              <Link
                to={`/hackathons/${hackathon.id}/edit`}
                state={{ returnTo: `/hackathons/${hackathon.id}` }}
                className={buttonVariants({
                  variant: "default",
                  size: "default",
                })}
              >
                Edit Hackathon
              </Link>
            )}

            {!hackathon.canEdit &&
              currentPhase?.phaseName === HackathonPhaseName.REGISTRATION &&
              (isMembershipPending ? (
                <div className="flex items-center gap-2">
                  <Spinner />
                  <p className="text-sm text-muted-foreground">
                    Checking membership...
                  </p>
                </div>
              ) : isMembershipError ? (
                <div className="flex items-center gap-3">
                  <p className="text-sm text-destructive">
                    Unable to check your membership.
                  </p>
                  <Button
                    variant="outline"
                    size="default"
                    onClick={() => void refetchMembership()}
                  >
                    Retry
                  </Button>
                </div>
              ) : isMembershipSuccess ? (
                !membership?.isRegistered ? (
                  <Button
                    variant="default"
                    size="default"
                    disabled={
                      registerMutation.isPending || unregisterMutation.isPending
                    }
                    onClick={() => {
                      unregisterMutation.reset();
                      registerMutation.mutate();
                    }}
                  >
                    {registerMutation.isPending ? "Registering..." : "Register"}
                  </Button>
                ) : membership?.role === HackathonRoleName.PARTICIPANT ? (
                  <AlertDialog>
                    <AlertDialogTrigger
                      render={<Button variant="default" size="default" />}
                    >
                      Unregister
                    </AlertDialogTrigger>

                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          You will lose your membership in this hackathon and
                          leave your team.
                        </AlertDialogDescription>
                      </AlertDialogHeader>

                      <AlertDialogCancel>Cancel</AlertDialogCancel>

                      <AlertDialogAction
                        render={
                          <Button
                            variant="default"
                            size="default"
                            disabled={
                              unregisterMutation.isPending ||
                              registerMutation.isPending
                            }
                            onClick={() => {
                              registerMutation.reset();
                              unregisterMutation.mutate();
                            }}
                          />
                        }
                      >
                        {unregisterMutation.isPending
                          ? "Unregistering..."
                          : "Unregister"}
                      </AlertDialogAction>
                    </AlertDialogContent>
                  </AlertDialog>
                ) : null
              ) : null)}
          </div>
        </div>
        <dl className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
          <div className="flex flex-wrap items-baseline gap-2">
            <dt className="font-medium">Start</dt>
            <dd className="text-muted-foreground">
              {new Date(hackathon.startAt).toLocaleString("en-GB", {
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </dd>
          </div>
          <div className="flex flex-wrap items-baseline gap-2">
            <dt className="font-medium">End</dt>
            <dd className="text-muted-foreground">
              {new Date(hackathon.endAt).toLocaleString("en-GB", {
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </dd>
          </div>
        </dl>
        {(registerMutation.isError || unregisterMutation.isError) && (
          <div role="alert" className="rounded-md border p-3">
            {registerMutation.isError && (
              <p className="text-sm text-destructive">
                {isAxiosError(registerMutation.error)
                  ? registerMutation.error.response?.data?.message
                  : registerMutation.error.message}
              </p>
            )}
            {unregisterMutation.isError && (
              <p className="text-sm text-destructive text-left sm:text-center">
                {isAxiosError(unregisterMutation.error)
                  ? unregisterMutation.error.response?.data?.message
                  : unregisterMutation.error.message}
              </p>
            )}
          </div>
        )}
      </header>

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="min-w-0 space-y-4">
          {canManageJury && (
            <JuryManagement
              key={hackathon.id}
              hackathonId={hackathon.id}
              canManage
            />
          )}

          {canEvaluate && currentUserId !== undefined && (
            <JuryEvaluation
              key={`${currentUserId}:${hackathon.id}`}
              hackathonId={hackathon.id}
              userId={currentUserId}
            />
          )}

          {canViewRankings && currentUserId !== undefined && (
            <HackathonRankings
              hackathonId={hackathon.id}
              userId={currentUserId}
              isPublished={evaluationEnded}
            />
          )}

          {!hasPrimaryContent && (
            <section className="space-y-2 rounded-lg border p-4">
              <h2 className="font-semibold">About this hackathon</h2>
              <p className="whitespace-pre-wrap break-words text-sm text-muted-foreground">
                {hackathon.description || "No description provided."}
              </p>
            </section>
          )}
        </div>

        <aside className="min-w-0 space-y-4" aria-label="Hackathon information">
          {hasPrimaryContent && (
            <section className="space-y-2 rounded-lg border p-4">
              <h2 className="font-semibold">About this hackathon</h2>
              <p className="whitespace-pre-wrap break-words text-sm text-muted-foreground">
                {hackathon.description || "No description provided."}
              </p>
            </section>
          )}

          {!canManageJury && (
            <section className="space-y-3">
              <h2 className="font-semibold">Jury and evaluation criteria</h2>
              <JudgeManagement
                key={`judges:${hackathon.id}`}
                hackathonId={hackathon.id}
                canManage={false}
              />
              <ScoringCriteriaManagement
                key={`criteria:${hackathon.id}`}
                hackathonId={hackathon.id}
                canManage={false}
              />
            </section>
          )}
        </aside>
      </div>
    </section>
  );
}
