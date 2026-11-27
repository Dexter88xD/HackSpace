export interface FriendUser {
  id: number;
  username: string;
}

export interface Friend {
  friendshipId: number;
  user: FriendUser;
  friendsSince: string | null;
  isOnline: boolean;
}

export interface FriendRequest {
  id: number;
  user: FriendUser;
  createdAt: string;
}

export type FriendshipStatus =
  | "none"
  | "outgoing"
  | "incoming"
  | "accepted";

export interface RelationshipStatus {
  status: FriendshipStatus;
  friendshipId: number | null;
}

export interface SendFriendRequestResponse {
  id: number;
  requesterId: number;
  addresseeId: number;
  status: "PENDING";
  createdAt: string;
}
