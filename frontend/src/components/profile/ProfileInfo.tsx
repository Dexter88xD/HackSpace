import { useQuery } from "@tanstack/react-query";
import { getProfileSkills } from "@/api/skills";
import { shouldRetryQuery } from "@/lib/query-retry";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Profile } from "@/types/profile";

type ProfileInfoProps = {
  profile: Profile;
  onEdit: () => void;
};

export function ProfileInfo({ profile, onEdit }: ProfileInfoProps) {
  const skillsQuery = useQuery({
    queryKey: ["skills", "profile", profile.id],
    queryFn: ({ signal }) => getProfileSkills(profile.id, signal),
    retry: shouldRetryQuery,
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile Information</CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        <div>
          <h3 className="font-semibold">Bio</h3>
          <p>{profile.bio || "No bio provided"}</p>
        </div>

        <div>
          <h3 className="font-semibold">Organization</h3>
          <p>{profile.organization_name || "Not specified"}</p>
        </div>

        <div>
          <h3 className="font-semibold">Major</h3>
          <p>{profile.major || "Not specified"}</p>
        </div>

        <div className="space-y-2">
          <h3 className="font-semibold">Skills</h3>
          {skillsQuery.isPending ? (
            <p role="status" className="text-sm text-muted-foreground">
              Loading skills…
            </p>
          ) : skillsQuery.isError ? (
            <div role="alert" className="text-sm text-destructive">
              Could not load skills.
              <Button
                type="button"
                variant="link"
                onClick={() => void skillsQuery.refetch()}
              >
                Retry loading skills
              </Button>
            </div>
          ) : skillsQuery.data.length > 0 ? (
            <ul aria-label="Profile skills" className="flex flex-wrap gap-2">
              {skillsQuery.data.map((skill) => (
                <li
                  key={skill.id}
                  className="max-w-full break-words rounded-lg bg-secondary px-2.5 py-1 text-sm text-secondary-foreground"
                >
                  {skill.name}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">
              No skills added yet.
            </p>
          )}
        </div>

        <Button onClick={onEdit}>Edit Profile</Button>
      </CardContent>
    </Card>
  );
}
