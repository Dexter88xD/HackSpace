import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";

import {
  getRelationshipStatus,
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  cancelFriendRequest,
  removeFriend,
} from "@/api/friends";

type FriendshipButtonProps = {
  userId: number;
  isOwnProfile?: boolean;
};

type Action = "send" | "accept" | "reject" | "cancel" | "remove";

export default function FriendshipButton({
  userId,
  isOwnProfile = false,
}: FriendshipButtonProps) {
  const queryClient = useQueryClient();

  const relationshipQuery = useQuery({
    queryKey: ["friends", "relationship", userId],
    queryFn: () => getRelationshipStatus(userId),
    enabled: !isOwnProfile && userId > 0,
    retry: false,
  });

  const mutation = useMutation({
    mutationFn: async (action: Action) => {
      const friendshipId = relationshipQuery.data?.friendshipId;

      if (action === "send") {
        await sendFriendRequest(userId);
        return;
      }

      if (friendshipId == null) {
        throw new Error("Friendship ID is missing");
      }

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

  if (isOwnProfile) {
    return null;
  }

  if (relationshipQuery.isPending) {
    return <Button disabled>Loading...</Button>;
  }

  if (relationshipQuery.isError) {
    return (
      <Button
        variant="outline"
        onClick={() => void relationshipQuery.refetch()}
      >
        Retry friendship status
      </Button>
    );
  }

  const status = relationshipQuery.data.status;
  const loading = mutation.isPending;

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {status === "none" && (
          <Button disabled={loading} onClick={() => mutation.mutate("send")}>
            {loading ? "Sending..." : "Add Friend"}
          </Button>
        )}

        {status === "outgoing" && (
          <Button
            variant="outline"
            disabled={loading}
            onClick={() => mutation.mutate("cancel")}
          >
            {loading ? "Canceling..." : "Cancel Request"}
          </Button>
        )}

        {status === "incoming" && (
          <>
            <Button
              disabled={loading}
              onClick={() => mutation.mutate("accept")}
            >
              Accept
            </Button>

            <Button
              variant="outline"
              disabled={loading}
              onClick={() => mutation.mutate("reject")}
            >
              Reject
            </Button>
          </>
        )}

        {status === "accepted" && (
          <Button
            variant="destructive"
            disabled={loading}
            onClick={() => mutation.mutate("remove")}
          >
            {loading ? "Removing..." : "Remove Friend"}
          </Button>
        )}
      </div>

      {mutation.isError && (
        <p role="alert" className="text-sm text-destructive">
          {mutation.error instanceof Error
            ? mutation.error.message
            : "Something went wrong. Please try again."}
        </p>
      )}
    </div>
  );
}
