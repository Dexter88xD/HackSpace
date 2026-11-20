import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { LoaderCircle } from "lucide-react";
import axios from "axios";

import { getMe } from "@/api/auth";
import { getProfile } from "@/api/profile";

import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { ProfileInfo } from "@/components/profile/ProfileInfo";
import { ProfileForm } from "@/components/profile/ProfileForm";
import type { Profile as ProfileData } from "@/types/profile";
import type { User } from "@/types/user";

function Profile() {
  const userQuery = useQuery({
    queryKey: ["me"],
    queryFn: getMe,
    retry: false,
  });

  const profileQuery = useQuery({
    queryKey: ["profile", "me"],
    queryFn: async () => {
      try {
        return await getProfile();
      } catch (error) {
        if (
          axios.isAxiosError(error) &&
          error.response?.status === 404 &&
          error.response?.data?.message === "Profile not found"
        ) {
          // Cache absence as data so avatar-triggered refetches keep the editor
          // mounted instead of returning to the initial loading screen.
          return null;
        }
        throw error;
      }
    },
    retry: false,
    enabled: userQuery.isSuccess,
    refetchInterval: 50 * 60 * 1000,
  });

  if (userQuery.isPending || profileQuery.isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoaderCircle className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (userQuery.isError) {
    return <p className="p-6 text-destructive">Failed to load account.</p>;
  }

  if (profileQuery.isError && profileQuery.data === undefined) {
    return <p className="p-6 text-destructive">Failed to load profile.</p>;
  }

  return (
    <ProfileDetails user={userQuery.data} profile={profileQuery.data ?? null} />
  );
}

function ProfileDetails({
  user,
  profile,
}: {
  user: User;
  profile: ProfileData | null;
}) {
  // Once creation begins, keep the same form until the user saves or cancels,
  // even if an avatar upload creates the profile in the background.
  const [isEditing, setIsEditing] = useState(!profile);

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 p-6">
      <h1 className="text-3xl font-bold">
        {profile ? "My Profile" : "Create Your Profile"}
      </h1>

      <ProfileHeader
        user={user}
        avatarUrl={profile?.avatarUrl}
        avatarFileId={profile?.avatarFileId}
      />

      {!profile || isEditing ? (
        <ProfileForm
          profile={profile}
          onCancel={profile ? () => setIsEditing(false) : undefined}
          onSuccess={() => setIsEditing(false)}
        />
      ) : (
        <ProfileInfo profile={profile} onEdit={() => setIsEditing(true)} />
      )}
    </div>
  );
}

export default Profile;
