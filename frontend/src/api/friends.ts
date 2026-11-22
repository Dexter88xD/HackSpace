import api from "./client";

import type {
  Friend,
  FriendRequest,
  RelationshipStatus,
  SendFriendRequestResponse,
} from "@/types/friends";

// Get accepted friends
export async function getFriends(): Promise<Friend[]> {
  const response = await api.get<Friend[]>("/friends");
  return response.data;
}

// Get requests received from other users
export async function getIncomingRequests(): Promise<FriendRequest[]> {
  const response = await api.get<FriendRequest[]>("/friends/requests/incoming");
  return response.data;
}

// Get requests sent to other users
export async function getOutgoingRequests(): Promise<FriendRequest[]> {
  const response = await api.get<FriendRequest[]>("/friends/requests/outgoing");
  return response.data;
}

// Check friendship status with another user
export async function getRelationshipStatus(
  userId: number,
): Promise<RelationshipStatus> {
  const response = await api.get<RelationshipStatus>(
    `/friends/status/${userId}`,
  );
  return response.data;
}

// Send friend request
export async function sendFriendRequest(
  addresseeId: number,
): Promise<SendFriendRequestResponse> {
  const response = await api.post<SendFriendRequestResponse>(
    "/friends/requests",
    { addresseeId },
  );
  return response.data;
}

// Accept request
export async function acceptFriendRequest(friendshipId: number): Promise<void> {
  await api.patch(`/friends/requests/${friendshipId}/accept`);
}

// Reject request
export async function rejectFriendRequest(friendshipId: number): Promise<void> {
  await api.delete(`/friends/requests/${friendshipId}/reject`);
}

// Cancel outgoing request
export async function cancelFriendRequest(friendshipId: number): Promise<void> {
  await api.delete(`/friends/requests/${friendshipId}/cancel`);
}

// Remove an accepted friend
export async function removeFriend(friendshipId: number): Promise<void> {
  await api.delete(`/friends/${friendshipId}`);
}
