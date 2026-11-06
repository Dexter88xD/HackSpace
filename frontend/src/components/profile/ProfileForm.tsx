
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { Loader2 } from "lucide-react";

import {
  profileSchema,
  type ProfileFormData,
} from "@/schemas/profile.schema";

import { createProfile, updateProfile } from "@/api/profile";
import type { Profile } from "@/types/profile";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type ProfileFormProps = {
  profile?: Profile | null;
  onCancel?: () => void;
  onSuccess?: () => void;
};

export function ProfileForm({
  profile,
  onCancel,
  onSuccess,
}: ProfileFormProps) {
  const queryClient = useQueryClient();
  const isEditing = !!profile;

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      bio: profile?.bio ?? "",
      organization_name: profile?.organization_name ?? "",
      major: profile?.major ?? "",
      avatar_url: profile?.avatar_url ?? "",
    },
  });

  const profileMutation = useMutation({
    mutationFn: (data: ProfileFormData) =>
      isEditing
        ? updateProfile(data)
        : createProfile(data),

    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["profile", "me"],
      });

      onSuccess?.();
    },
  });

  function onSubmit(data: ProfileFormData) {
    profileMutation.mutate(data);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {isEditing ? "Edit Profile" : "Create Profile"}
        </CardTitle>
      </CardHeader>

      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="bio">Bio</FieldLabel>
              <Textarea
                id="bio"
                placeholder="Tell us about yourself..."
                {...form.register("bio")}
              />
              {form.formState.errors.bio && (
                <FieldError>
                  {form.formState.errors.bio.message}
                </FieldError>
              )}
            </Field>

            <Field>
              <FieldLabel htmlFor="organization">
                Organization
              </FieldLabel>
              <Input
                id="organization"
                placeholder="Your organization"
                {...form.register("organization_name")}
              />
              {form.formState.errors.organization_name && (
                <FieldError>
                  {form.formState.errors.organization_name.message}
                </FieldError>
              )}
            </Field>

            <Field>
              <FieldLabel htmlFor="major">Major</FieldLabel>
              <Input
                id="major"
                placeholder="Your field of study"
                {...form.register("major")}
              />
              {form.formState.errors.major && (
                <FieldError>
                  {form.formState.errors.major.message}
                </FieldError>
              )}
            </Field>

            <Field>
              <FieldLabel htmlFor="avatar">
                Avatar URL
              </FieldLabel>
              <Input
                id="avatar"
                type="url"
                placeholder="https://example.com/avatar.jpg"
                {...form.register("avatar_url")}
              />
              {form.formState.errors.avatar_url && (
                <FieldError>
                  {form.formState.errors.avatar_url.message}
                </FieldError>
              )}
            </Field>

            {profileMutation.isError && (
              <FieldError>
                {axios.isAxiosError(profileMutation.error)
                  ? profileMutation.error.response?.data?.message ??
                    "Failed to save profile"
                  : "Something went wrong"}
              </FieldError>
            )}

            {profileMutation.isSuccess && (
              <p className="text-sm text-green-600" role="status">
                Profile saved successfully.
              </p>
            )}

            <div className="flex gap-2">
              <Button
                type="submit"
                disabled={profileMutation.isPending}
              >
                {profileMutation.isPending && (
                  <Loader2 className="animate-spin" />
                )}
                {profileMutation.isPending
                  ? "Saving..."
                  : isEditing
                    ? "Save Changes"
                    : "Create Profile"}
              </Button>

              {isEditing && onCancel && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCancel}
                  disabled={profileMutation.isPending}
                >
                  Cancel
                </Button>
              )}
            </div>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  );
}
