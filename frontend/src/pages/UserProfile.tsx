
import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";

import { getMe } from "@/api/auth";
import { getPublicProfile } from "@/api/users";
import FriendshipButton from "@/components/friends/FriendshipButton";
import { Button } from "@/components/ui/button";

import { useEffect, useState } from "react";

import axios from "axios";

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

  const [avatarError, setAvatarError] = useState(false);
  useEffect(() => {
    setAvatarError(false);
  }, [userQuery.data?.avatarUrl]);

  if (!validId) {
    return <p className="p-6">Invalid user ID.</p>;
  }

  if (userQuery.isPending || meQuery.isPending) {
    return <p className="p-6">Loading profile...</p>;
  }

  if (userQuery.isError
    && axios.isAxiosError(userQuery.error)
    && userQuery.error.response?.status === 404
  ) {
    return (
      <div className="p-6">
        <h1 className="text-x1 font-semibold">User not found</h1>
        <p className="text-muted-foreground">This user doesn't exist</p>
        <Link to="/friends" className="underline">Back to Friends</Link>
      </div>
    );
  }


  if (userQuery.isError) {
    return (
      <div className="p-6">
        <p className="mb-3 text-destructive">
          Could not load this user's profile.
        </p>
        <Button
          variant="outline"
          onClick={() => void userQuery.refetch()}
        >
          Retry
        </Button>
      </div>
    );
  }

  if (meQuery.isError) {
    return (
      <p className="p-6 text-destructive">
        Could not load your account.
      </p>
    );
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
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted">
                {user.avatarUrl && !avatarError ? (
                  <img
                    src={user.avatarUrl}
                    alt={`${user.username}'s avatar`}
                    className="h-full w-full object-cover"
                    referrerPolicy="no-referrer"
                    onError={() => setAvatarError(true)}
                  />
                ) : (
                  <span className="text-2xl font-semibold uppercase">
                    {user.username.charAt(0)}
                  </span>
                )}
            </div>

            <div>
                <h1 className="text-2xl font-bold">
                {user.fullName}
                </h1>

                <p className="text-muted-foreground">
                @{user.username}
                </p>
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

        <div className="space-y-3">
          <h2 className="font-semibold">Skills</h2>
          {user.skills.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {user.skills.map((skill) => (
                <span
                  key={skill}
                  className="rounded-full bg-seconday px-3 py-1 text-sm"
                >
                  {skill}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              NO skills added yet.
            </p>
          )}
        </div>

      </div>
    </div>
  </div>
  );
}
