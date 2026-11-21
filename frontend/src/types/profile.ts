export interface Profile {
  id: number;
  bio: string | null;
  avatarUrl: string | null;
  avatarFileId: string | null;
  organizationName: string | null;
  major: string | null;
}

export interface ProfileInput {
  bio?: string;
  organizationName?: string;
  major?: string;
}
