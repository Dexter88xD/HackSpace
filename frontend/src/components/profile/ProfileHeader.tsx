
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
        <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gray-200">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={`${user.fullName}'s avatar`}
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="text-2xl font-bold text-gray-600">
              {user.fullName?.charAt(0).toUpperCase() || "U"}
            </span>
          )}
        </div>

        <div>
          <h2 className="text-xl font-semibold">
            {user.fullName}
          </h2>

          <p className="text-sm text-gray-500">
            @{user.username}
          </p>

          <p className="text-sm">{user.email}</p>

          <p className="text-xs text-gray-500">
            {user.emailVerified
              ? "Verified account"
              : "Email not verified"}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
