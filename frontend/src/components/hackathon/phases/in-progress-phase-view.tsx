import { useQuery } from "@tanstack/react-query";
import { CalendarDays } from "lucide-react";
import { getMyTeam } from "@/api/team";
import { TeamSubmissionCard } from "@/components/team/TeamSubmissionCard";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { shouldRetryQuery } from "@/lib/query-retry";
import { HackathonRoleName } from "@/types/hackathon";
import type { HackathonMembershipResponse } from "@/types/hackathon";

type InProgressPhaseViewProps = {
  hackathonId: number;
  phaseEndAt: string;
  membership: HackathonMembershipResponse | undefined;
  isMembershipPending: boolean;
  isMembershipError: boolean;
  onRetryMembership: () => void;
};

export default function InProgressPhaseView({
  hackathonId,
  phaseEndAt,
  membership,
  isMembershipPending,
  isMembershipError,
  onRetryMembership,
}: InProgressPhaseViewProps) {
  const isParticipant =
    !isMembershipPending &&
    !isMembershipError &&
    membership?.isRegistered === true &&
    membership.role === HackathonRoleName.PARTICIPANT;

  const teamQuery = useQuery({
    queryKey: ["my-team", hackathonId],
    queryFn: () => getMyTeam(hackathonId),
    enabled: isParticipant,
    retry: shouldRetryQuery,
    refetchInterval: 4000,
  });

  const endDate = new Date(phaseEndAt).toLocaleString("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return (
    <section aria-labelledby="in-progress-phase-title" className="space-y-4">
      <div className="rounded-xl border border-border p-4 sm:p-6">
        <h2 id="in-progress-phase-title" className="text-lg font-semibold">
          Hackathon in progress
        </h2>

        <p className="mt-1 text-sm text-muted-foreground">
          Teams are working on their projects and preparing their submissions.
        </p>

        <div className="mt-4 flex items-start gap-3">
          <CalendarDays
            className="mt-0.5 size-4 shrink-0 text-muted-foreground"
            aria-hidden="true"
          />

          <div>
            <p className="text-sm font-medium">Submission deadline</p>
            <p className="text-sm text-muted-foreground">{endDate}</p>
          </div>
        </div>

        {isMembershipPending ? (
          <div className="mt-4 flex items-center gap-2" role="status">
            <Spinner />
            <p className="text-sm text-muted-foreground">
              Checking membership...
            </p>
          </div>
        ) : isMembershipError ? (
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <p role="alert" className="text-sm text-destructive">
              Unable to check your membership.
            </p>

            <Button variant="outline" onClick={onRetryMembership}>
              Retry
            </Button>
          </div>
        ) : !membership ? (
          <p className="mt-4 text-sm text-muted-foreground">
            Membership status is unavailable.
          </p>
        ) : !membership.isRegistered ? (
          <p className="mt-4 rounded-lg bg-muted p-3 text-sm">
            Registration is closed for this hackathon.
          </p>
        ) : isParticipant ? (
          teamQuery.isPending ? (
            <div className="mt-4 flex items-center gap-2" role="status">
              <Spinner />
              <p className="text-sm text-muted-foreground">
                Loading your team...
              </p>
            </div>
          ) : teamQuery.isError ? (
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <p role="alert" className="text-sm text-destructive">
                Unable to load your team.
              </p>

              <Button
                variant="outline"
                onClick={() => void teamQuery.refetch()}
              >
                Retry
              </Button>
            </div>
          ) : !teamQuery.data?.team ? (
            <p className="mt-4 rounded-lg bg-muted p-3 text-sm">
              You are not a member of a team. Only team members can submit a
              project.
            </p>
          ) : (
            <p className="mt-4 text-sm text-muted-foreground">
              Submitting as{" "}
              <span className="font-medium text-foreground">
                {teamQuery.data.team.name}
              </span>
            </p>
          )
        ) : null}
      </div>

      {isParticipant && teamQuery.isSuccess && teamQuery.data.team && (
        <TeamSubmissionCard
          key={teamQuery.data.team.id}
          teamId={teamQuery.data.team.id}
        />
      )}
    </section>
  );
}
