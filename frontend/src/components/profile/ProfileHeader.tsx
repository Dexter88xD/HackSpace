import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { deleteAvatar, uploadAvatar } from "@/api/profile";
import { Card, CardContent } from "@/components/ui/card";
import type { User } from "@/types/user";
import type { Profile } from "@/types/profile";
import { Button } from "../ui/button";
import { ArrowUpIcon, LoaderCircle, Trash2 } from "lucide-react";
import { FileUpload, FileUploadTrigger } from "@/components/ui/file-upload";

type ProfileHeaderProps = {
  user: User;
  avatarUrl?: string | null;
  avatarFileId?: string | null;
};

const MAX_AVATAR_SIZE_BYTES =
  Number(import.meta.env.VITE_MAX_FILE_UPLOAD_BYTES) || 10485760; // 10 MiB default

export function ProfileHeader({
  user,
  avatarUrl,
  avatarFileId,
}: ProfileHeaderProps) {
  const queryClient = useQueryClient();
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState("");
  const [failedAvatarUrl, setFailedAvatarUrl] = useState<string | null>(null);
  // Use the application's cookie-authenticated endpoint so displaying an avatar
  // does not depend on a separate storage hostname, certificate, or signed URL.
  const avatarSrc = avatarUrl
    ? `/api/users/me/profile/avatar?file=${encodeURIComponent(avatarFileId ?? "current")}`
    : null;
  const uploadMutation = useMutation({
    mutationFn: uploadAvatar,
    onMutate: async () => {
      setError("");
      await queryClient.cancelQueries({ queryKey: ["profile", "me"] });
    },
    onSuccess: async (url) => {
      queryClient.setQueryData<Profile>(["profile", "me"], (profile) =>
        profile ? { ...profile, avatarUrl: url } : profile,
      );
      await queryClient.invalidateQueries({ queryKey: ["profile", "me"] });
    },
    onError: (uploadError) => {
      const message = axios.isAxiosError<{ message?: string | string[] }>(
        uploadError,
      )
        ? uploadError.response?.data?.message
        : undefined;
      setError(
        axios.isAxiosError(uploadError) && uploadError.response?.status === 413
          ? "This image is too large. Choose a smaller image."
          : Array.isArray(message)
            ? message.join(". ")
            : message || "Failed to upload avatar. Please try again.",
      );
    },
    onSettled: () => setFiles([]),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAvatar,
    onMutate: async () => {
      setError("");
      await queryClient.cancelQueries({ queryKey: ["profile", "me"] });
    },
    onSuccess: async () => {
      queryClient.setQueryData<Profile>(["profile", "me"], (profile) =>
        profile ? { ...profile, avatarUrl: null, avatarFileId: null } : profile,
      );
      await queryClient.invalidateQueries({ queryKey: ["profile", "me"] });
    },
    onError: () => setError("Failed to remove avatar. Please try again."),
  });
  const isPending = uploadMutation.isPending || deleteMutation.isPending;

  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-4">
        <div className="flex flex-col items-center gap-1">
          <div className="flex h-40 w-40 items-center justify-center overflow-hidden rounded-full bg-gray-200">
            {avatarSrc && failedAvatarUrl !== avatarSrc ? (
              <img
                src={avatarSrc}
                onError={() => setFailedAvatarUrl(avatarSrc)}
                alt={`${user.fullName}'s avatar`}
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="text-2xl font-bold text-gray-600">
                {user.fullName?.charAt(0).toUpperCase() || "U"}
              </span>
            )}
          </div>
          <FileUpload
            value={files}
            onValueChange={setFiles}
            onFileAccept={(file) => uploadMutation.mutate(file)}
            onFileReject={(_, message) => setError(message)}
            disabled={isPending}
            accept="image/jpeg,image/png"
            maxFiles={1}
            maxSize={MAX_AVATAR_SIZE_BYTES}
          >
            <FileUploadTrigger
              aria-label={
                uploadMutation.isPending ? "Uploading avatar" : "Upload avatar"
              }
              aria-busy={uploadMutation.isPending}
              render={
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="mt-2"
                />
              }
            >
              {uploadMutation.isPending ? (
                <LoaderCircle className="animate-spin" />
              ) : (
                <>
                  Upload Avatar
                  <ArrowUpIcon />
                </>
              )}
            </FileUploadTrigger>
          </FileUpload>
          {avatarUrl && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={isPending}
              onClick={() => deleteMutation.mutate()}
              aria-busy={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? (
                <LoaderCircle className="animate-spin" />
              ) : (
                <Trash2 />
              )}
              Remove avatar
            </Button>
          )}
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
        </div>

        <div className="flex flex-col items-center">
          <h2 className="text-xl font-semibold">{user.fullName}</h2>

          <p className="text-sm text-muted-foreground">@{user.username}</p>

          <p className="text-sm">{user.email}</p>

          <p className="text-xs text-muted-foreground">
            {user.emailVerified ? "Verified account" : "Email not verified"}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
