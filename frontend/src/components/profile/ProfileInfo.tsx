
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Profile } from "@/types/profile";

type ProfileInfoProps = {
  profile: Profile;
  onEdit: () => void;
};

export function ProfileInfo({
  profile,
  onEdit,
}: ProfileInfoProps) {
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

        <Button onClick={onEdit}>
          Edit Profile
        </Button>
      </CardContent>
    </Card>
  );
}
