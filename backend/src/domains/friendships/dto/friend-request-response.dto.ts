export interface FriendRequestResponseDto {
    id: number;
    user: {
        id: number;
        username: string;
    }
    createdAt: Date;
}