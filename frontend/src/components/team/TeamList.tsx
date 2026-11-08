import type { TeamSummary } from "@/types/team";
import { Button } from "@/components/ui/button";

type TeamListProps = {
  teams: TeamSummary[];
  onJoin: (teamId: number) => void;
  isJoining: boolean;
};

function TeamList({ teams, onJoin, isJoining }: TeamListProps) {
  if (teams.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No teams yet. Create the first one below.
      </p>
    );
  }

  return (
    <ul className="divide-y rounded-xl border border-border bg-card shadow-sm">
      {teams.map((team) => {
        const isFull = team.memberCount >= team.maxMembers;

        return (
          <li
            key={team.id}
            className="flex items-center justify-between gap-4 px-4 py-3"
          >
            <div className="min-w-0">
              <p className="font-medium break-words">{team.name}</p>
              <p className="text-sm text-muted-foreground">
                {team.memberCount} / {team.maxMembers} members
              </p>
            </div>
            <Button
              variant="outline"
              disabled={isFull || isJoining}
              onClick={() => onJoin(team.id)}
            >
              {isFull ? "Full" : "Join"}
            </Button>
          </li>
        );
      })}
    </ul>
  );
}

export default TeamList;
