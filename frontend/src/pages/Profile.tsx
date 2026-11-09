
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { LoaderCircle } from "lucide-react";
import axios from "axios";

import { getMe } from "@/api/auth";
import { getProfile } from "@/api/profile";

import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { ProfileInfo } from "@/components/profile/ProfileInfo";
import { ProfileForm } from "@/components/profile/ProfileForm";

function Profile() {
  const [isEditing, setIsEditing] = useState(false);

  const userQuery = useQuery({
    queryKey: ["me"],
    queryFn: getMe,
    retry: false,
  });

  const profileQuery = useQuery({
    queryKey: ["profile", "me"],
    queryFn: getProfile,
    retry: false,
    enabled: userQuery.isSuccess,
  });

  const profileNotFound =
    profileQuery.isError &&
    axios.isAxiosError(profileQuery.error) &&
    profileQuery.error.response?.status === 404 &&
    profileQuery.error.response?.data?.message === "Profile not found";

  if (userQuery.isPending || profileQuery.isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoaderCircle className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (userQuery.isError) {
    return <p className="p-6 text-red-500">Failed to load account.</p>;
  }

  if (profileQuery.isError && !profileNotFound) {
    return <p className="p-6 text-red-500">Failed to load profile.</p>;
  }

  const profile = profileQuery.data ?? null;

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 p-6">
      <h1 className="text-3xl font-bold">
        {profile ? "My Profile" : "Create Your Profile"}
      </h1>

      <ProfileHeader
        user={userQuery.data}
        avatarUrl={profile?.avatarUrl}
      />

      {!profile ? (
        <ProfileForm />
      ) : isEditing ? (
        <ProfileForm
          profile={profile}
          onCancel={() => setIsEditing(false)}
          onSuccess={() => setIsEditing(false)}
        />
      ) : (
        <ProfileInfo
          profile={profile}
          onEdit={() => setIsEditing(true)}
        />
      )}
    </div>
  );
}

export default Profile;
