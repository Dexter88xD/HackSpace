import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
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
} from "@/api/hackathon";
import { HackathonPhaseName, HackathonRoleName } from "@/types/hackathon";
import { JudgeManagement } from "@/components/jury/JudgeManagement";
import { ScoringCriteriaManagement } from "@/components/jury/ScoringCriteriaManagement";
import { JuryEvaluation } from "@/components/jury/JuryEvaluation";
import { HackathonRankings } from "@/components/jury/HackathonRankings";
import { useEffect, useState } from "react";
import HackathonPhaseSchedule from "@/components/hackathon/hackathon-phase-schedule";
import LaunchPhaseView from "@/components/hackathon/phases/launch-phase-view";
import RegistrationPhaseView from "@/components/hackathon/phases/registration-phase-view";
import InProgressPhaseView from "@/components/hackathon/phases/in-progress-phase-view";
import EvaluationPhaseView from "@/components/hackathon/phases/evaluation-phase-view";
import FinishedPhaseView from "@/components/hackathon/phases/finished-phase-view";
import { getMyTeam } from "@/api/team";
import { TeamSubmissionCard } from "@/components/team/TeamSubmissionCard";

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

  const {
    data: currentPhase,
    isPending: isPhasePending,
    isError: isPhaseError,
    refetch: refetchPhase,
  } = useQuery({
    queryKey: ["phase", hackathonId],
    refetchInterval: 10000,
    queryFn: () => {
      if (hackathonId === null) {
        throw new Error("Invalid hackathon ID");
      }

      return getHackathonCurrentPhase(hackathonId);
    },
    enabled: hackathonId !== null,
    retry: shouldRetryQuery,
  });

  const isInProgress =
    !isPhasePending &&
    !isPhaseError &&
    currentPhase?.phaseName === HackathonPhaseName.IN_PROGRESS &&
    now >= new Date(currentPhase.startAt).getTime() &&
    now < new Date(currentPhase.endAt).getTime();

  const isParticipant =
    isMembershipSuccess &&
    !isMembershipError &&
    membership?.isRegistered === true &&
    membership.role === HackathonRoleName.PARTICIPANT;

  const teamQuery = useQuery({
    queryKey: ["my-team", hackathonId],
    queryFn: () => {
      if (hackathonId === null) {
        throw new Error("Invalid hackathon ID");
      }

      return getMyTeam(hackathonId);
    },
    enabled:
      hackathonId !== null &&
      currentUserId !== undefined &&
      isInProgress &&
      isParticipant,
    retry: shouldRetryQuery,
    refetchInterval: 4000,
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
  const registrationPhase = hackathon.phases.find(
    (phase) => phase.phaseName === HackathonPhaseName.REGISTRATION,
  );

  const evaluationPhase = hackathon.phases.find(
    (phase) => phase.phaseName === HackathonPhaseName.EVALUATION,
  );

  const evaluationStarted =
    evaluationPhase !== undefined &&
    now >= new Date(evaluationPhase.startAt).getTime();

  const evaluationEnded =
    evaluationPhase !== undefined &&
    now >= new Date(evaluationPhase.endAt).getTime();

  const canManageJudges =
    hackathon.canEdit && evaluationPhase !== undefined && !evaluationStarted;

  const inProgressPhase = hackathon.phases.find(
    (phase) => phase.phaseName === HackathonPhaseName.IN_PROGRESS,
  );

  const canManageCriteria =
    hackathon.canEdit &&
    inProgressPhase !== undefined &&
    now < new Date(inProgressPhase.startAt).getTime();

  const isEvaluationOpen =
    !isPhasePending &&
    !isPhaseError &&
    phaseName === HackathonPhaseName.EVALUATION &&
    evaluationStarted &&
    !evaluationEnded;

  const canEvaluate =
    isEvaluationOpen &&
    isMembershipSuccess &&
    !isMembershipError &&
    membership?.role === HackathonRoleName.JURY;

  const canViewRankings =
    evaluationEnded || (hackathon.canEdit && isEvaluationOpen);

  const showEvaluationView = isEvaluationOpen;

  const showFinishedView =
    evaluationEnded ||
    (!isPhasePending &&
      !isPhaseError &&
      phaseName === HackathonPhaseName.FINISHED);

  const phaseLabels: Record<HackathonPhaseName, string> = {
    [HackathonPhaseName.LAUNCH]: "Launch",
    [HackathonPhaseName.REGISTRATION]: "Registration",
    [HackathonPhaseName.IN_PROGRESS]: "In progress",
    [HackathonPhaseName.EVALUATION]: "Evaluation",
    [HackathonPhaseName.FINISHED]: "Finished",
  };

  const showLaunchView =
    !isPhasePending &&
    !isPhaseError &&
    !showFinishedView &&
    phaseName === HackathonPhaseName.LAUNCH &&
    registrationPhase !== undefined;

  const showRegistrationView =
    !isPhasePending &&
    !isPhaseError &&
    !showFinishedView &&
    phaseName === HackathonPhaseName.REGISTRATION &&
    registrationPhase !== undefined &&
    now >= new Date(registrationPhase.startAt).getTime() &&
    now < new Date(registrationPhase.endAt).getTime();

  const showInProgressView = isInProgress && !showFinishedView;

  const hasPhaseView =
    showLaunchView ||
    showRegistrationView ||
    showInProgressView ||
    showEvaluationView ||
    showFinishedView;

  const phaseLabel = isPhasePending
    ? "Loading phase"
    : isPhaseError
      ? "Phase unavailable"
      : showFinishedView
        ? "Finished"
        : phaseName
          ? phaseLabels[phaseName]
          : now < new Date(hackathon.startAt).getTime()
            ? "Upcoming"
            : "Phase unavailable";

  return (
    <section className="mx-auto w-full max-w-7xl space-y-4 px-4 py-4 sm:px-6 lg:px-8">
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
                {phaseLabel}
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
          </div>
        </div>
        <dl className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
          <div className="flex flex-wrap items-baseline gap-2">
            <dt className="font-medium">Start</dt>
            <dd className="text-muted-foreground">
              {new Date(hackathon.startAt).toLocaleString("en-US", {
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </dd>
          </div>
          <div className="flex flex-wrap items-baseline gap-2">
            <dt className="font-medium">End</dt>
            <dd className="text-muted-foreground">
              {new Date(hackathon.endAt).toLocaleString("en-US", {
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </dd>
          </div>
        </dl>
      </header>

      <section aria-label="Hackathon phase schedule">
        {isPhasePending ? (
          <p role="status" className="text-sm text-muted-foreground">
            Loading current phase...
          </p>
        ) : isPhaseError ? (
          <div className="flex flex-wrap items-center gap-3">
            <p role="alert" className="text-sm text-destructive">
              Unable to load the current phase.
            </p>

            <Button variant="outline" onClick={() => void refetchPhase()}>
              Retry
            </Button>
          </div>
        ) : (
          <HackathonPhaseSchedule
            phases={hackathon.phases}
            currentPhaseName={currentPhase?.phaseName ?? null}
            now={now}
          />
        )}
      </section>

      {/* Phase information and hackathon description */}
      <div className="grid grid-cols-1 items-stretch gap-4 md:grid-cols-2">
        <div className="min-w-0 [&>*]:h-full">
          {/* LAUNCH */}
          {showLaunchView && registrationPhase && (
            <LaunchPhaseView registrationStartAt={registrationPhase.startAt} />
          )}

          {/* REGISTRATION */}
          {showRegistrationView && registrationPhase && (
            <RegistrationPhaseView
              key={hackathon.id}
              hackathonId={hackathon.id}
              registrationEndAt={registrationPhase.endAt}
              canEdit={hackathon.canEdit}
              isRegistered={membership?.isRegistered ?? false}
              membershipRole={membership?.role ?? null}
              isMembershipPending={isMembershipPending}
              isMembershipError={isMembershipError}
              isMembershipSuccess={isMembershipSuccess}
              onRetryMembership={() => void refetchMembership()}
            />
          )}

          {/* IN_PROGRESS */}
          {showInProgressView && currentPhase && (
            <InProgressPhaseView
              key={hackathon.id}
              phaseEndAt={currentPhase.endAt}
              membership={membership}
              isMembershipPending={isMembershipPending}
              isMembershipError={isMembershipError}
              onRetryMembership={() => void refetchMembership()}
              teamQuery={teamQuery}
            />
          )}

          {/* EVALUATION */}
          {showEvaluationView && evaluationPhase && (
            <EvaluationPhaseView evaluationEndAt={evaluationPhase.endAt} />
          )}

          {/* FINISHED */}
          {showFinishedView && <FinishedPhaseView />}

          {/* Missing or unavailable phase */}
          {!hasPhaseView && (
            <section className="space-y-2 rounded-xl border border-border p-4 sm:p-6">
              <h2 className="text-lg font-semibold">Hackathon status</h2>

              <p className="text-sm text-muted-foreground">
                {isPhasePending
                  ? "Loading the current phase..."
                  : isPhaseError
                    ? "The current phase is temporarily unavailable."
                    : now < new Date(hackathon.startAt).getTime()
                      ? "This hackathon has not started yet."
                      : "No active phase is currently available."}
              </p>
            </section>
          )}
        </div>

        {/* Description */}
        <section className="min-w-0 space-y-2 rounded-xl border border-border p-4 sm:p-6">
          <h2 className="text-lg font-semibold">About this hackathon</h2>

          <p className="whitespace-pre-wrap break-words text-sm text-muted-foreground">
            {hackathon.description || "No description provided."}
          </p>
        </section>
      </div>

      {/* Jury and evaluation criteria */}
      <section className="space-y-3">
        <h2 className="font-semibold">Jury and evaluation criteria</h2>

        <div className="grid grid-cols-1 items-stretch gap-4 md:grid-cols-2">
          <div className="min-w-0 [&>*]:h-full">
            <JudgeManagement
              key={`judges:${hackathon.id}`}
              hackathonId={hackathon.id}
              canManage={canManageJudges}
            />
          </div>

          <div className="min-w-0 [&>*]:h-full">
            <ScoringCriteriaManagement
              key={`criteria:${hackathon.id}`}
              hackathonId={hackathon.id}
              canManage={canManageCriteria}
            />
          </div>
        </div>
      </section>

      {/* Full-width team submission interface */}
      {showInProgressView &&
        isParticipant &&
        teamQuery.isSuccess &&
        teamQuery.data.team && (
          <TeamSubmissionCard
            key={teamQuery.data.team.id}
            teamId={teamQuery.data.team.id}
          />
        )}

      {/* Full-width jury evaluation interface */}
      {canEvaluate && currentUserId !== undefined && (
        <JuryEvaluation
          key={`${currentUserId}:${hackathon.id}`}
          hackathonId={hackathon.id}
          userId={currentUserId}
        />
      )}

      {/* Full-width rankings */}
      {canViewRankings && currentUserId !== undefined && (
        <HackathonRankings
          hackathonId={hackathon.id}
          userId={currentUserId}
          isPublished={evaluationEnded}
        />
      )}

      {/* Missing ranking schedule fallback */}
      {showFinishedView && !evaluationEnded && (
        <section className="space-y-2 rounded-xl border border-border p-4">
          <h2 className="font-semibold">Final rankings</h2>

          <p className="text-sm text-muted-foreground">
            Rankings are currently unavailable.
          </p>
        </section>
      )}
    </section>
  );
}
