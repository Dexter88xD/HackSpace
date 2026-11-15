import type { MyJoinRequest, TeamSummary } from "@/types/team";
import { Button } from "@/components/ui/button";

type TeamListProps = {
  teams: TeamSummary[];
  myRequests: MyJoinRequest[];
  onRequest: (teamId: number) => void;
  onCancel: (requestId: number) => void;
  isBusy: boolean;
};

function TeamList({
  teams,
  myRequests,
  onRequest,
  onCancel,
  isBusy,
}: TeamListProps) {
  if (teams.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No teams yet. Create the first one.
      </p>
    );
  }

  return (
    <ul className="divide-y">
      {teams.map((team) => {
        const isFull = team.memberCount >= team.maxMembers;
        const pending = myRequests.find(
          (request) => request.teamId === team.id,
        );

        return (
          <li
            key={team.id}
            className="flex items-center justify-between gap-4 py-3"
          >
            <div className="min-w-0">
              <p className="font-medium break-words">{team.name}</p>
              <p className="text-sm text-muted-foreground">
                {team.memberCount} / {team.maxMembers} members
                {pending && " · Request pending"}
              </p>
            </div>
            {pending ? (
              <Button
                variant="outline"
                disabled={isBusy}
                onClick={() => onCancel(pending.id)}
              >
                Cancel request
              </Button>
            ) : (
              <Button
                variant="outline"
                disabled={isFull || isBusy}
                onClick={() => onRequest(team.id)}
              >
                {isFull ? "Full" : "Request to join"}
              </Button>
            )}
          </li>
        );
      })}
    </ul>
  );
}

export default TeamList;
