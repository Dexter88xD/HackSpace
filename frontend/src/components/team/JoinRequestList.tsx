import type { TeamJoinRequest } from "@/types/team";
import { Button } from "@/components/ui/button";

type JoinRequestListProps = {
  requests: TeamJoinRequest[];
  onAccept: (requestId: number) => void;
  onReject: (requestId: number) => void;
  isBusy: boolean;
  canAccept: boolean;
};

function JoinRequestList({
  requests,
  onAccept,
  onReject,
  isBusy,
  canAccept,
}: JoinRequestListProps) {
  if (requests.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No pending requests.</p>
    );
  }

  return (
    <ul className="divide-y">
      {requests.map((request) => (
        <li
          key={request.id}
          className="flex items-center justify-between gap-4 py-3"
        >
          <div className="min-w-0">
            <p className="font-medium">{request.fullName}</p>
            <p className="text-sm text-muted-foreground">@{request.username}</p>
          </div>
          <div className="flex gap-2">
            {canAccept && (
              <Button
                size="sm"
                disabled={isBusy}
                onClick={() => onAccept(request.id)}
              >
                Accept
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              disabled={isBusy}
              onClick={() => onReject(request.id)}
            >
              Reject
            </Button>
          </div>
        </li>
      ))}
    </ul>
  );
}

export default JoinRequestList;
