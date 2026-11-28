import type { ReactNode } from "react";
import type { Team } from "@/types/team";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import ConfirmButton from "./ConfirmButton";

type TeamDetailsProps = {
  team: Team;
  // Buttons shown next to the team name (edit, delete, leave).
  actions: ReactNode;
  // Only passed when the current user is the leader.
  onRemove?: (userId: number) => void;
  isRemoving?: boolean;
  canRemoveMember?: boolean;
};

function TeamDetails({
  team,
  actions,
  onRemove,
  isRemoving,
  canRemoveMember = false,
}: TeamDetailsProps) {
  const memberCount = team.members.length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl font-semibold">{team.name}</CardTitle>
        <CardDescription className="whitespace-pre-wrap break-words">
          {team.description || "No description provided."}
        </CardDescription>
        <CardAction className="flex flex-wrap justify-end gap-2">
          {actions}
        </CardAction>
      </CardHeader>

      <CardContent>
        <h3 className="font-semibold">
          Members ({memberCount} / {team.maxMembers})
        </h3>
        {memberCount < team.minMembers && (
          <p className="mt-1 text-muted-foreground">
            This hackathon needs at least {team.minMembers} members per team.
          </p>
        )}
        <ul className="mt-2 divide-y">
          {team.members.map((member) => {
            const isLeader = member.userId === team.leaderId;

            return (
              <li
                key={member.userId}
                className="flex items-center justify-between gap-4 py-3"
              >
                <div className="min-w-0">
                  <p className="font-medium">
                    {member.fullName}
                    {isLeader && (
                      <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                        Leader
                      </span>
                    )}
                  </p>
                  <p className="text-muted-foreground">@{member.username}</p>
                </div>
                {onRemove && !isLeader && canRemoveMember && (
                  <ConfirmButton
                    label="Remove"
                    title={`Remove ${member.fullName}?`}
                    description="They will need to request to join again."
                    confirmLabel="Remove"
                    onConfirm={() => onRemove(member.userId)}
                    isPending={!!isRemoving}
                    size="sm"
                  />
                )}
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}

export default TeamDetails;
