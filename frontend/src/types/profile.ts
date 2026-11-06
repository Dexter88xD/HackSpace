export interface Profile {
	id: number;
	bio: string | null;
	avatar_url: string | null;
	organization_name: string | null;
	major: string | null;
}

export interface ProfileInput {
	bio?: string;
	avatar_url?: string;
	organization_name?: string;
	major?: string;
}
