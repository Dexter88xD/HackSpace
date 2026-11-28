import { useState } from "react";

type UserAvatarProps = {
    username: string;
    avatarUrl: string | null;
    size?: string;
}

export function UserAvatar({
    username,
    avatarUrl,
    size = "h-12 w-12",
}: UserAvatarProps) {
    const [failedUrl, setFailedUrl] = useState<string | null>(null);
    const showImage = Boolean(avatarUrl && avatarUrl !== failedUrl);

    return (
        <div
        className={`${size} flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted`}
        >
        {showImage ? (
            <img
            src={avatarUrl!}
            alt={`${username}'s avatar`}
            className="h-full w-full object-cover"
            onError={() => setFailedUrl(avatarUrl)}
            />
        ) : (
            <span className="font-semibold uppercase">
            {username.charAt(0)}
            </span>
        )}
        </div>
    );
}