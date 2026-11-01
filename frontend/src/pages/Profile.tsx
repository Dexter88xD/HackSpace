import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { Textarea } from "../components/ui/textarea"
import { useState, useEffect } from "react"
import { getProfile, createProfile } from "../api/profile"
import { getMe } from "../api/auth"
import type { Profile } from "../types/profile"
import type { User } from "../types/user"
import axios from "axios"

type ProfileData = {
	id: number;
	bio: string | null;
	avatar_url: string | null;
	organization_name: string | null;
	major: string | null;
}

const mockProfile: ProfileData = {
	id: 1,
	bio: "Software engineering student passionate about technology and hackathons.",
	avatar_url: null,
	organization_name: "1337 Coding School",
	major: "Software Engineering",
};

export default function Profile() {
	const [profile, setProfile] = useState<Profile | null>(null);
	const [user, setUser] = useState<User | null>(null);
	const [formData, setFormData] = useState<Profile | null>(null);

	const [isEditing, setIsEditing] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [isSaving, setIsSaving] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const [hasProfile, setHasProfile] = useState(true);

	function handleEdit() {
		if (!profile) return;

		setFormData({ ...profile });
		setIsEditing(true);
	}

	function handleCancel() {
		setFormData(null);
		setIsEditing(false);
	}

	function handleSave() {
		if (!formData) return;

		setProfile({ ...formData });
		setIsEditing(false);
	}

	useEffect(() => {
		let active = true;

		async function loadProfile() {
			setIsLoading(true);
			setError(null);

			try {
				const data = await getProfile();

				if (active) {
					setProfile(data);
				}
			} catch (err) {
				if (axios.isAxiosError(err) && err.response?.status === 404) {
					console.log("BLOC 1");
					setHasProfile(false);
					setFormData({
						id: 0,
						bio: "",
						avatar_url: null,
						organization_name: "",
						major: "",
					});

				}
				else {
					console.log("BLOC 2	");
					console.error(err);
					setError("Failed to load profile");
				}
			}

			finally {
				if (active) {
					console.log("BLOC 3");
					setIsLoading(false);
				}
			}
		}

		void loadProfile();

		return () => {
			active = false;
		};
	}, []);



	useEffect(() => {
		async function loadUser() {
			try {
				const data = await getMe();
				setUser(data);
			}
			catch (err) {
				console.error("Failed to load user", err);
			}
		}

		void loadUser();
	})

	async function handleCreate() {
		if (!formData || isSaving)
			return;

		setIsSaving(true);
		setError(null);

		try {
			const newProfile = await createProfile({
				bio: formData.bio ?? "",
				avatar_url: formData.avatar_url ?? undefined,
				organization_name: formData.organization_name ?? "",
				major: formData.major ?? "",
			})

			setProfile(newProfile);
			setHasProfile(true);
			setFormData(null);
		}
		catch (err) {
			console.error(err);
			setError("Failed to create profile");
		}
		finally {
			setIsSaving(false);
		}
	}
	if (isLoading) {
		return <p className="p-6">Loading profile...</p>;
	}

	if (error && hasProfile && !profile) {
		return <p className="p-6 text-red-500">{error}</p>;
	}

	if (!hasProfile) {
		return (
			<div className="max-w-2xl mx-auto p-6">
				<h1 className="text-3xl font-bold mb-6">Create Your Profile</h1>

				<Card>
					<CardHeader>
						<CardTitle>Profile Information</CardTitle>
					</CardHeader>

					<CardContent className="space-y-4">
						<div>
							<label>Bio</label>
							<Textarea
								value={formData?.bio ?? ""}
								onChange={(e) =>
									setFormData((prev) =>
										prev ? { ...prev, bio: e.target.value } : null
									)
								}
							/>
						</div>

						<div>
							<label>Organization</label>
							<Input
								value={formData?.organization_name ?? ""}
								onChange={(e) =>
									setFormData((prev) =>
										prev ? { ...prev, organization_name: e.target.value } : null
									)
								}
							/>
						</div>

						<div>
							<label>Major</label>
							<Input
								value={formData?.major ?? ""}
								onChange={(e) =>
									setFormData((prev) =>
										prev ? { ...prev, major: e.target.value } : null
									)
								}
							/>
						</div>
						{error && (
							<p className="text-sm text-red-500">{error}</p>
						)}
						<Button onClick={handleCreate} disabled={isSaving}>
							{isSaving ? "Creating..." : "Create Profile"}
						</Button>
					</CardContent>
				</Card>
			</div>
		);
	}

	return (
		<div className="max-w-2xl mx-auto p-6">
			<h1 className="text-3xl font-bold mb-6">My Profile</h1>
			{user && (
				<Card className="mb-6">
					<CardContent className="flex items-center gap-4 pt-6">

						<div className="w-20 h-20 rounded-full bg-gray-200 overflow-hidden flex items-center justify-center">
							{profile?.avatar_url ? (
								<img
									src={profile.avatar_url}
									alt="Profile avatar"
									className="w-full h-full object-cover"
								/>
							) : (
								<span className="text-2xl font-bold text-gray-600">
									{user.fullName.charAt(0).toUpperCase()}
								</span>
							)}
						</div>

						<div>
							<h2 className="text-xl font-semibold">
								{user.fullName}
							</h2>

							<p className="text-sm text-gray-500">
								@{user.username}
							</p>

							<p className="text-sm">
								{user.email}
							</p>

							<p className="text-xs text-gray-500">
								{user.emailVerified ? "Verified account" : "Email not verified"}
							</p>
						</div>

					</CardContent>
				</Card>
			)}
			<Card>
				<CardHeader>
					<CardTitle>Profile Information</CardTitle>
				</CardHeader>

				<CardContent className="space-y-4">
					{isEditing ? (
						<>
							<div>
								<label>Bio</label>
								<Textarea
									value={formData?.bio ?? ""}
									onChange={(e) =>
										setFormData((prev) =>
											prev ? { ...prev, bio: e.target.value } : null)
									}
								/>
							</div>

							<div>
								<label>Organization</label>
								<Input
									value={formData?.organization_name ?? ""}
									onChange={(e) =>
										setFormData((prev) =>
											prev ? { ...prev, organization_name: e.target.value } : null
										)
									}
								/>
							</div>

							<div>
								<label>Major</label>
								<Input
									value={formData?.major ?? ""}
									onChange={(e) =>
										setFormData((prev) =>
											prev ? { ...prev, major: e.target.value } : null
										)
									}
								/>
							</div>

							<div className="flex gap-2">
								<Button onClick={handleSave}>Save Changes</Button>
								<Button variant="outline" onClick={handleCancel}>
									Cancel
								</Button>
							</div>
						</>
					) : (
						<>
							<div>
								<h3 className="font-semibold">Bio</h3>
								<p>{profile?.bio ?? "No bio provided"}</p>
							</div>

							<div>
								<h3 className="font-semibold">Organization</h3>
								<p>{profile?.organization_name ?? "Not specified"}</p>
							</div>

							<div>
								<h3 className="font-semibold">Major</h3>
								<p>{profile?.major ?? "Not specified"}</p>
							</div>

							<Button onClick={handleEdit}>Edit Profile</Button>
						</>
					)}
				</CardContent>
			</Card>
		</div>
	);
}