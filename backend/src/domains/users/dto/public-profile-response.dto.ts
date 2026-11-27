export class PublicProfileResponseDto {
    id!: number;
    username!: string;
    fullName!: string;
    bio!: string | null;
    major!: string | null;
    organizationName!: string | null;
    avatarUrl!: string | null;
    skills!: string[];
}