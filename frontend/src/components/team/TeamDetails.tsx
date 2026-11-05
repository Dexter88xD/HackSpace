import type { Team } from "@/types/team";

type TeamDetailsProps = {
  team: Team;
};

function TeamDetails({ team }: TeamDetailsProps) {
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
          {team.members.map((member) => (
            <li key={member.userId} className="px-4 py-3">
              <p className="font-medium">{member.fullName}</p>
              <p className="text-sm text-muted-foreground">
                @{member.username}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default TeamDetails;
