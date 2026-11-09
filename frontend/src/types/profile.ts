export interface Profile {
	id: number;
	bio: string | null;
	avatarUrl: string | null;
	organizationName: string | null;
	major: string | null;
}

export interface ProfileInput {
	bio?: string;
	avatarUrl?: string;
	organizationName?: string;
	major?: string;
}
