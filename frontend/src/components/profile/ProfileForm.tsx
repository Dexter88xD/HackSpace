import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { Loader2 } from "lucide-react";

import { profileSchema, type ProfileFormData } from "@/schemas/profile.schema";

import { createProfile, updateProfile } from "@/api/profile";
import { getProfileSkills } from "@/api/skills";
import { saveProfileSkills } from "@/lib/profile-skills";
import { shouldRetryQuery } from "@/lib/query-retry";
import type { SelectedSkill } from "@/types/skill";
import { ProfileSkillsField } from "./ProfileSkillsField";
import type { Profile } from "@/types/profile";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  const savedProfileId = useRef(profile?.id);
  const [hasSavedProfile, setHasSavedProfile] = useState(!!profile);
  const [draftSkills, setDraftSkills] = useState<SelectedSkill[] | null>(null);
  const skillsQuery = useQuery({
    queryKey: ["skills", "profile", profile?.id],
    queryFn: ({ signal }) => getProfileSkills(profile!.id, signal),
    enabled: !!profile,
    retry: shouldRetryQuery,
    refetchOnWindowFocus: false,
  });
  const skillsReady = !profile || skillsQuery.isSuccess;
  const selectedSkills = draftSkills ?? skillsQuery.data ?? [];
  const isEditing = hasSavedProfile;

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
    mutationFn: async (data: ProfileFormData) => {
      const savedProfile =
        savedProfileId.current !== undefined
          ? await updateProfile(data)
          : await createProfile(data);
      savedProfileId.current = savedProfile.id;
      setHasSavedProfile(true);
      try {
        const savedSkills = await saveProfileSkills(
          savedProfile.id,
          selectedSkills,
        );
        setDraftSkills(savedSkills);
      } catch (error) {
        const message = axios.isAxiosError<{ message?: string | string[] }>(
          error,
        )
          ? error.response?.data?.message
          : undefined;
        throw Object.assign(
          new Error(
            `Profile fields were saved, but skills could not be fully saved. Some skill changes may already have applied. Your selections are kept; save again to retry.${message ? ` ${Array.isArray(message) ? message.join(". ") : message}` : ""}`,
          ),
          { cause: error },
        );
      } finally {
        // Preserve the local draft if refetching reveals a partially completed save.
        await queryClient.invalidateQueries({ queryKey: ["skills"] });
      }
    },
    retry: false,

    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["profile", "me"],
      });

      onSuccess?.();
    },
  });

  function onSubmit(data: ProfileFormData) {
    if (!skillsReady || profileMutation.isPending) return;
    setDraftSkills([...selectedSkills]);
    profileMutation.mutate(data);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEditing ? "Edit Profile" : "Create Profile"}</CardTitle>
      </CardHeader>

      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <fieldset disabled={profileMutation.isPending} className="min-w-0">
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="bio">Bio</FieldLabel>
                <Textarea
                  id="bio"
                  placeholder="Tell us about yourself..."
                  {...form.register("bio")}
                />
                {form.formState.errors.bio && (
                  <FieldError>{form.formState.errors.bio.message}</FieldError>
                )}
              </Field>

              <Field>
                <FieldLabel htmlFor="organization">Organization</FieldLabel>
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
                  <FieldError>{form.formState.errors.major.message}</FieldError>
                )}
              </Field>

              <Field>
                <FieldLabel htmlFor="avatar">Avatar URL</FieldLabel>
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

              <ProfileSkillsField
                selected={selectedSkills}
                onChange={setDraftSkills}
                disabled={profileMutation.isPending || !skillsReady}
                loading={!!profile && skillsQuery.isPending}
                loadError={!!profile && skillsQuery.isError}
                onRetry={() => void skillsQuery.refetch()}
              />

              {profileMutation.isError && (
                <FieldError>
                  {axios.isAxiosError(profileMutation.error)
                    ? (profileMutation.error.response?.data?.message ??
                      "Failed to save profile")
                    : profileMutation.error instanceof Error
                      ? profileMutation.error.message
                      : "Failed to save profile"}
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
                  disabled={profileMutation.isPending || !skillsReady}
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
          </fieldset>
        </form>
      </CardContent>
    </Card>
  );
}
