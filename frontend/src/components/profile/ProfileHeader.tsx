import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { uploadAvatar } from "@/api/profile";
import { Card, CardContent } from "@/components/ui/card";
import type { User } from "@/types/user";
import type { Profile } from "@/types/profile";
import { Button } from "../ui/button";
import { ArrowUpIcon, LoaderCircle } from "lucide-react";
import { FileUpload, FileUploadTrigger } from "@/components/ui/file-upload";

type ProfileHeaderProps = {
  user: User;
  avatarUrl?: string | null;
};

const MAX_AVATAR_SIZE_BYTES = Number(import.meta.env.VITE_MAX_FILE_UPLOAD_BYTES) || 10485760; // 10 MiB default

export function ProfileHeader({
  user,
  avatarUrl,
}: ProfileHeaderProps) {
  const queryClient = useQueryClient();
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState("");
  const uploadMutation = useMutation({
    mutationFn: uploadAvatar,
    onMutate: () => setError(""),
    onSuccess: async (url) => {
      queryClient.setQueryData<Profile>(["profile", "me"], (profile) =>
        profile ? { ...profile, avatarUrl: url } : profile,
      );
      await queryClient.invalidateQueries({ queryKey: ["profile", "me"] });
    },
    onError: (uploadError) => {
      const message = axios.isAxiosError<{ message?: string | string[] }>(uploadError)
        ? uploadError.response?.data?.message
        : undefined;
      setError(
        axios.isAxiosError(uploadError) && uploadError.response?.status === 413
          ? "This image is too large. Choose a smaller image."
          : Array.isArray(message) ? message.join(". ") : message || "Failed to upload avatar. Please try again.",
      );
    },
    onSettled: () => setFiles([]),
  });

  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-4">
        <div className="flex flex-col items-center gap-1">
          <div className="flex h-40 w-40 items-center justify-center overflow-hidden rounded-full bg-gray-200">
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
          <FileUpload
            value={files}
            onValueChange={setFiles}
            onFileAccept={(file) => uploadMutation.mutate(file)}
            onFileReject={(_, message) => setError(message)}
            disabled={uploadMutation.isPending}
            accept="image/jpeg,image/png"
            maxFiles={1}
            maxSize={MAX_AVATAR_SIZE_BYTES}
          >
            <FileUploadTrigger
              aria-label={uploadMutation.isPending ? "Uploading avatar" : "Upload avatar"}
              aria-busy={uploadMutation.isPending}
              render={<Button type="button" size="sm" variant="outline" className="mt-2" />}
            >
              {uploadMutation.isPending ? (
                <LoaderCircle className="animate-spin" />
              ) : (
                <>Upload Avatar<ArrowUpIcon /></>
              )}
            </FileUploadTrigger>
          </FileUpload>
          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        </div>

        <div className="flex flex-col items-center">
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
