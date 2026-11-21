
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";

import {
  getFriends,
  getIncomingRequests,
  getOutgoingRequests,
  acceptFriendRequest,
  rejectFriendRequest,
  cancelFriendRequest,
  removeFriend,
} from "@/api/friends";

type Tab = "friends" | "incoming" | "outgoing";
type Action = "accept" | "reject" | "cancel" | "remove";

type MutationInput = {
  action: Action;
  friendshipId: number;
};

export default function Friends() {
  const [activeTab, setActiveTab] = useState<Tab>("friends");
  const queryClient = useQueryClient();

  // Fetch data from the backend
  const friendsQuery = useQuery({
    queryKey: ["friends", "list"],
    queryFn: getFriends,
  });

  const incomingQuery = useQuery({
    queryKey: ["friends", "incoming"],
    queryFn: getIncomingRequests,
  });

  const outgoingQuery = useQuery({
    queryKey: ["friends", "outgoing"],
    queryFn: getOutgoingRequests,
  });

  // Perform friendship actions
  const mutation = useMutation({
    mutationFn: async ({ action, friendshipId }: MutationInput) => {
      switch (action) {
        case "accept":
          await acceptFriendRequest(friendshipId);
          break;

        case "reject":
          await rejectFriendRequest(friendshipId);
          break;

        case "cancel":
          await cancelFriendRequest(friendshipId);
          break;

        case "remove":
          await removeFriend(friendshipId);
          break;
      }
    },

    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["friends"],
      });
    },
  });

  // Select the active query
  const activeQuery =
    activeTab === "friends"
      ? friendsQuery
      : activeTab === "incoming"
        ? incomingQuery
        : outgoingQuery;

  const users = activeQuery.data ?? [];

  function handleAction(action: Action, friendshipId: number) {
    mutation.reset();
    mutation.mutate({ action, friendshipId });
  }

  return (
    <main className="mx-auto max-w-3xl p-6">
      <h1 className="mb-6 text-3xl font-bold">
        My Friends
      </h1>

      {/* Navigation tabs */}
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

      {/* Loading state */}
      {activeQuery.isPending && (
        <p className="text-muted-foreground">
          Loading...
        </p>
      )}

      {/* Fetch error */}
      {activeQuery.isError && (
        <div className="space-y-3">
          <p role="alert" className="text-destructive">
            Failed to load friendship data.
          </p>

          <Button
            variant="outline"
            onClick={() => void activeQuery.refetch()}
          >
            Retry
          </Button>
        </div>
      )}

      {/* Mutation error */}
      {mutation.isError && (
        <p role="alert" className="mb-4 text-sm text-destructive">
          {mutation.error instanceof Error
            ? mutation.error.message
            : "Friendship action failed."}
        </p>
      )}

      {/* Empty state */}
      {activeQuery.isSuccess && users.length === 0 && (
        <p className="py-10 text-center text-muted-foreground">
          Nothing to display.
        </p>
      )}

      {/* Friendship list */}
      {activeQuery.isSuccess && (
        <div className="space-y-3">
          {users.map((item) => {
            const friendshipId =
              "friendshipId" in item
                ? item.friendshipId
                : item.id;

            return (
              <div
                key={friendshipId}
                className="flex items-center justify-between gap-3 rounded-lg border p-4"
              >
                <div>
                  <p className="font-medium">
                    {item.user.username}
                  </p>

                  <p className="text-sm text-muted-foreground">
                    User #{item.user.id}
                  </p>
                </div>

                {/* Accepted friends */}
                {activeTab === "friends" && (
                  <Button
                    variant="destructive"
                    disabled={mutation.isPending}
                    onClick={() =>
                      handleAction("remove", friendshipId)
                    }
                  >
                    Remove
                  </Button>
                )}

                {/* Incoming requests */}
                {activeTab === "incoming" && (
                  <div className="flex gap-2">
                    <Button
                      disabled={mutation.isPending}
                      onClick={() =>
                        handleAction("accept", friendshipId)
                      }
                    >
                      Accept
                    </Button>

                    <Button
                      variant="outline"
                      disabled={mutation.isPending}
                      onClick={() =>
                        handleAction("reject", friendshipId)
                      }
                    >
                      Reject
                    </Button>
                  </div>
                )}

                {/* Outgoing requests */}
                {activeTab === "outgoing" && (
                  <Button
                    variant="outline"
                    disabled={mutation.isPending}
                    onClick={() =>
                      handleAction("cancel", friendshipId)
                    }
                  >
                    Cancel
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
