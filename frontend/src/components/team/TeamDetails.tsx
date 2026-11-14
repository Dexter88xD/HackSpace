import type { Team } from "@/types/team";
import { Button } from "@/components/ui/button";

type TeamDetailsProps = {
  team: Team;
  // Only passed when the current user is the leader.
  onRemove?: (userId: number) => void;
  isRemoving?: boolean;
};

function TeamDetails({ team, onRemove, isRemoving }: TeamDetailsProps) {
  const memberCount = team.members.length;

  return (
    <div className="space-y-6 rounded-xl border border-border bg-card p-6 shadow-sm">
      <div>
        <h2 className="text-2xl font-semibold">{team.name}</h2>
        <p className="mt-2 whitespace-pre-wrap break-words text-muted-foreground">
          {team.description || "No description provided."}
        </p>
      </div>

      <div>
        <h3 className="font-semibold">
          Members ({memberCount} / {team.maxMembers})
        </h3>
        {memberCount < team.minMembers && (
          <p className="mt-1 text-sm text-muted-foreground">
            This hackathon needs at least {team.minMembers} members per team.
          </p>
        )}
        <ul className="mt-3 divide-y rounded-lg border">
          {team.members.map((member) => {
            const isLeader = member.userId === team.leaderId;

            return (
              <li
                key={member.userId}
                className="flex items-center justify-between gap-4 px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="font-medium">
                    {member.fullName}
                    {isLeader && (
                      <span className="ml-2 text-xs text-muted-foreground">
                        Leader
                      </span>
                    )}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    @{member.username}
                  </p>
                </div>
                {onRemove && !isLeader && (
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={isRemoving}
                    onClick={() => onRemove(member.userId)}
                  >
                    Remove
                  </Button>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

export default TeamDetails;
