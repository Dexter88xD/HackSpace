import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { Button } from "@/components/ui/button";
import UserSearch from "@/components/friends/UserSearch";

import {
  getFriends,
  getIncomingRequests,
  getOutgoingRequests,
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  cancelFriendRequest,
  removeFriend,
} from "@/api/friendships";

type Tab = "friends" | "incoming" | "outgoing";
type Action = "accept" | "reject" | "cancel" | "remove";

function getErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError<{ message?: string | string[] }>(error)) {
    const message = error.response?.data?.message;
    if (Array.isArray(message)) return message.join(". ");
    if (message) return message;
  }
  return fallback;
}

export default function Friends() {
  const [activeTab, setActiveTab] = useState<Tab>("friends");
  const [targetUserId, setTargetUserId] = useState("");

  const queryClient = useQueryClient();

  const friendsQuery = useQuery({
    queryKey: ["friends", "list"],
    queryFn: getFriends,
    refetchInterval: 4000,
  });

  const incomingQuery = useQuery({
    queryKey: ["friends", "incoming"],
    queryFn: getIncomingRequests,
    refetchInterval: 4000,
  });

  const outgoingQuery = useQuery({
    queryKey: ["friends", "outgoing"],
    queryFn: getOutgoingRequests,
    refetchInterval: 4000,
  });

  const sendMutation = useMutation({
    mutationFn: sendFriendRequest,
    onSuccess: async () => {
      setTargetUserId("");
      await queryClient.invalidateQueries({
        queryKey: ["friends"],
      });
    },
  });

  const actionMutation = useMutation({
    mutationFn: async ({
      action,
      friendshipId,
    }: {
      action: Action;
      friendshipId: number;
    }) => {
      switch (action) {
        case "accept":
          return acceptFriendRequest(friendshipId);
        case "reject":
          return rejectFriendRequest(friendshipId);
        case "cancel":
          return cancelFriendRequest(friendshipId);
        case "remove":
          return removeFriend(friendshipId);
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["friends"],
      });
    },
  });

  const activeQuery =
    activeTab === "friends"
      ? friendsQuery
      : activeTab === "incoming"
        ? incomingQuery
        : outgoingQuery;

  const users = activeQuery.data ?? [];

  function handleSend(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const id = Number(targetUserId);

    if (!Number.isSafeInteger(id) || id <= 0) return;

    sendMutation.mutate(id);
  }

  function handleAction(action: Action, friendshipId: number) {
    actionMutation.reset();
    actionMutation.mutate({ action, friendshipId });
  }

  return (
    <div className="mx-auto max-w-3xl p-6">
      <h1 className="mb-6 text-3xl font-bold">My Friends</h1>
      <UserSearch />
      <form
        onSubmit={handleSend}
        className="mb-6 space-y-3 rounded-lg border p-4"
      >
        <h2 className="text-lg font-semibold">Add a friend</h2>

        <div className="flex gap-2">
          <input
            type="number"
            min="1"
            step="1"
            required
            value={targetUserId}
            onChange={(event) => {
              setTargetUserId(event.target.value);
              sendMutation.reset();
            }}
            placeholder="Enter user ID"
            aria-label="User ID"
            className="min-w-0 flex-1 rounded-md border bg-background px-3 py-2"
          />

          <Button type="submit" disabled={sendMutation.isPending}>
            {sendMutation.isPending ? "Sending..." : "Send Request"}
          </Button>
        </div>

        {sendMutation.isError && (
          <p role="alert" className="text-sm text-destructive">
            {getErrorMessage(
              sendMutation.error,
              "Request failed. Check the user ID or existing friendship.",
            )}
          </p>
        )}
      </form>

      <div className="mb-6 flex flex-wrap gap-2">
        <Button
          variant={activeTab === "friends" ? "default" : "outline"}
          onClick={() => setActiveTab("friends")}
        >
          Friends ({friendsQuery.data?.length ?? "..."})
        </Button>

        <Button
          variant={activeTab === "incoming" ? "default" : "outline"}
          onClick={() => setActiveTab("incoming")}
        >
          Incoming ({incomingQuery.data?.length ?? "..."})
        </Button>

        <Button
          variant={activeTab === "outgoing" ? "default" : "outline"}
          onClick={() => setActiveTab("outgoing")}
        >
          Outgoing ({outgoingQuery.data?.length ?? "..."})
        </Button>
      </div>

      {activeQuery.isPending && (
        <p className="text-muted-foreground">Loading...</p>
      )}

      {activeQuery.isError && (
        <div className="space-y-2">
          <p role="alert" className="text-destructive">
            Could not load friendship data.
          </p>
          <Button variant="outline" onClick={() => void activeQuery.refetch()}>
            Retry
          </Button>
        </div>
      )}

      {actionMutation.isError && (
        <p role="alert" className="mb-4 text-sm text-destructive">
          {getErrorMessage(
            actionMutation.error,
            "Action failed. Please try again.",
          )}
        </p>
      )}

      {activeQuery.isSuccess && users.length === 0 && (
        <p className="py-8 text-center text-muted-foreground">
          Nothing to display.
        </p>
      )}

      {activeQuery.isSuccess && (
        <div className="space-y-3">
          {users.map((item) => {
            const friendshipId =
              "friendshipId" in item ? item.friendshipId : item.id;

            return (
              <div
                key={friendshipId}
                className="flex items-center justify-between gap-3 rounded-lg border p-4"
              >
                <div>
                  <p className="font-medium">{item.user.username}</p>
                  <p className="text-sm text-muted-foreground">
                    User #{item.user.id}
                  </p>
                </div>

                {activeTab === "friends" && (
                  <Button
                    variant="destructive"
                    disabled={actionMutation.isPending}
                    onClick={() => handleAction("remove", friendshipId)}
                  >
                    Remove
                  </Button>
                )}

                {activeTab === "incoming" && (
                  <div className="flex gap-2">
                    <Button
                      disabled={actionMutation.isPending}
                      onClick={() => handleAction("accept", friendshipId)}
                    >
                      Accept
                    </Button>
                    <Button
                      variant="outline"
                      disabled={actionMutation.isPending}
                      onClick={() => handleAction("reject", friendshipId)}
                    >
                      Reject
                    </Button>
                  </div>
                )}

                {activeTab === "outgoing" && (
                  <Button
                    variant="outline"
                    disabled={actionMutation.isPending}
                    onClick={() => handleAction("cancel", friendshipId)}
                  >
                    Cancel
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
