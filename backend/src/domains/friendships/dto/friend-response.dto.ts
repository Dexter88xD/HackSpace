export interface FriendResponseDto {
    friendshipId: number;
    user: {
        id: number;
        username: string;
    };
    friendsSince : Date | null;
}