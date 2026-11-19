
import { Card, CardContent } from "@/components/ui/card";
import type { User } from "@/types/user";

type ProfileHeaderProps = {
  user: User;
  avatarUrl?: string | null;
};

export function ProfileHeader({
  user,
  avatarUrl,
}: ProfileHeaderProps) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 pt-6">
        <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={`${user.fullName}'s avatar`}
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="text-2xl font-bold text-muted-foreground">
              {user.fullName?.charAt(0).toUpperCase() || "U"}
            </span>
          )}
        </div>

        <div>
          <h2 className="text-xl font-semibold">
            {user.fullName}
          </h2>

          <p className="text-sm text-muted-foreground">
            @{user.username}
          </p>

          <p className="text-sm">{user.email}</p>

          <p className="text-xs text-muted-foreground">
            {user.emailVerified
              ? "Verified account"
              : "Email not verified"}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
