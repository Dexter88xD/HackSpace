import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";

import { getMe } from "@/api/auth";
import { getPublicProfile } from "@/api/users";
import FriendshipButton from "@/components/friends/FriendshipButton";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/profile/UserAvatar";
import { UserRoundX, ArrowLeft } from "lucide-react";

import axios from "axios";

function ProfileNotFound({ invalidId = false }: { invalidId?: boolean }) {
  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-xl border bg-card p-8 text-center shadow-sm">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
          <UserRoundX
            className="h-8 w-8 text-muted-foreground"
            aria-hidden="true"
          />
        </div>

        <h1 className="text-2xl font-semibold">
          {invalidId ? "Invalid profile link" : "User not found"}
        </h1>

        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          {invalidId
            ? "The profile link contains an invalid user ID."
            : "We couldn't find this user. The account may not exist, or the link may be incorrect."}
        </p>

        <Link
          to="/friends"
          className="mt-6 inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-5 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
        >
          <ArrowLeft className="h-4 w-4 shrink-0" />
          <span>Back to Friends</span>
        </Link>
      </div>
    </div>
  );
}

export default function UserProfile() {
  const { id } = useParams<{ id: string }>();
  const userId = Number(id);

  const validId = Number.isSafeInteger(userId) && userId > 0;

  const userQuery = useQuery({
    queryKey: ["users", "public", userId],
    queryFn: () => getPublicProfile(userId),
    enabled: validId,
    retry: false,
  });

  const meQuery = useQuery({
    queryKey: ["me"],
    queryFn: getMe,
    enabled: validId,
    retry: false,
  });

  if (!validId) {
    return <ProfileNotFound invalidId />;
  }

  if (userQuery.isPending || meQuery.isPending) {
    return <p className="p-6">Loading profile...</p>;
  }

  if (
    userQuery.isError &&
    axios.isAxiosError(userQuery.error) &&
    userQuery.error.response?.status === 404
  ) {
    return <ProfileNotFound />;
  }

  if (userQuery.isError) {
    return (
      <div className="p-6">
        <p className="mb-3 text-destructive">
          Could not load this user's profile.
        </p>
        <Button variant="outline" onClick={() => void userQuery.refetch()}>
          Retry
        </Button>
      </div>
    );
  }

  if (meQuery.isError) {
    return <p className="p-6 text-destructive">Could not load your account.</p>;
  }

  const user = userQuery.data;
  const isOwnProfile = meQuery.data.id === user.id;

  return (
    <div className="mx-auto max-w-2xl p-6">
      <Link
        to="/friends"
        className="mb-6 inline-block text-sm text-muted-foreground hover:underline"
      >
        Back to Friends
      </Link>

      <div className="space-y-6 rounded-xl border p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <UserAvatar
              username={user.username}
              avatarUrl={user.avatarUrl}
              size="h-20 w-20"
            />

            <div>
              <h1 className="text-2xl font-bold">{user.fullName}</h1>

              <p className="text-muted-foreground">@{user.username}</p>
            </div>
          </div>

          {isOwnProfile ? (
            <Link
              to="/profile"
              className="inline-flex h-9 items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
            >
              My Profile
            </Link>
          ) : (
            <FriendshipButton userId={user.id} />
          )}
        </div>

        <div className="space-y-2">
          <h2 className="font-semibold">About</h2>
          <p className="text-sm text-muted-foreground">
            {user.bio || "No bio provided."}
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <h2 className="font-semibold">Major</h2>
            <p className="text-sm text-muted-foreground">
              {user.major || "Not specified"}
            </p>
          </div>

          <div>
            <h2 className="font-semibold">Organization</h2>
            <p className="text-sm text-muted-foreground">
              {user.organizationName || "Not specified"}
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <h2 className="font-semibold">Skills</h2>

          {user.skills.length > 0 ? (
            <ul aria-label="Profile skills" className="flex flex-wrap gap-2">
              {user.skills.map((skill) => (
                <li
                  key={skill}
                  className="max-w-full break-words rounded-lg bg-secondary px-2.5 py-1 text-sm text-secondary-foreground"
                >
                  {skill}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">
              No skills added yet.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
