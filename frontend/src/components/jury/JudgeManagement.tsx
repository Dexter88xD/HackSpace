import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  assignHackathonJudge,
  getHackathonJudges,
  removeHackathonJudge,
} from "@/api/jury";
import { searchUsers } from "@/api/users";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { shouldRetryQuery } from "@/lib/query-retry";
import { getJuryError } from "./jury-error";
import { Trash2 } from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

type Props = {
  hackathonId: number;
  canManage: boolean;
};

export function JudgeManagement({ hackathonId, canManage }: Props) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const queryKey = ["hackathon-judges", hackathonId];

  const judgesQuery = useQuery({
    queryKey,
    queryFn: () => getHackathonJudges(hackathonId),
    retry: shouldRetryQuery,
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 350);

    return () => clearTimeout(timer);
  }, [search]);

  const searchQuery = useQuery({
    queryKey: ["users", "search", debouncedSearch],
    queryFn: () => searchUsers(debouncedSearch),
    enabled:
      canManage && debouncedSearch.length >= 2 && debouncedSearch.length <= 50,
    retry: false,
  });

  const assignMutation = useMutation({
    mutationFn: (userId: number) =>
      assignHackathonJudge(hackathonId, { userId }),

    onSuccess: async () => {
      setSearch("");
      await queryClient.invalidateQueries({ queryKey });
    },
  });

  const removeMutation = useMutation({
    mutationFn: (judgeId: number) => removeHackathonJudge(hackathonId, judgeId),

    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey });
    },
  });

  const isMutating = assignMutation.isPending || removeMutation.isPending;

  const judges = judgesQuery.data ?? [];
  const assignedIds = new Set(judges.map((judge) => judge.userId));

  const showResults =
    search.trim().length >= 2 && search.trim() === debouncedSearch;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between gap-2">
          <span>Judges</span>

          {judgesQuery.isSuccess && (
            <span className="text-xs font-normal text-muted-foreground">
              {judges.length} assigned
            </span>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {judgesQuery.isPending && <p role="status">Loading judges...</p>}

        {judgesQuery.isError && (
          <div className="space-y-2">
            <p role="alert" className="text-sm text-destructive">
              {getJuryError(judgesQuery.error)}
            </p>

            <Button
              variant="outline"
              onClick={() => void judgesQuery.refetch()}
            >
              Retry
            </Button>
          </div>
        )}

        {judgesQuery.isSuccess &&
          (judges.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No judges assigned yet.
            </p>
          ) : (
            <ul className="divide-y rounded-md border">
              {judges.map((judge) => (
                <li
                  key={judge.id}
                  className="flex flex-wrap items-center justify-between gap-2 p-3 text-sm"
                >
                  <span className="min-w-0 break-words">@{judge.username}</span>

                  {canManage && (
                    <AlertDialog>
                      <AlertDialogTrigger
                        render={
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={isMutating}
                            className="text-destructive"
                            aria-label={`Remove judge ${judge.username}`}
                          />
                        }
                      >
                        <Trash2 className="size-4" aria-hidden="true" />

                        {removeMutation.isPending &&
                        removeMutation.variables === judge.id
                          ? "Removing..."
                          : "Remove"}
                      </AlertDialogTrigger>

                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Remove judge?</AlertDialogTitle>

                          <AlertDialogDescription>
                            @{judge.username} will lose their judge assignment
                            for this hackathon. This will not delete their
                            account or affect their other hackathon memberships.
                          </AlertDialogDescription>
                        </AlertDialogHeader>

                        <AlertDialogCancel>Cancel</AlertDialogCancel>

                        <AlertDialogAction
                          render={
                            <Button
                              variant="destructive"
                              disabled={isMutating || !canManage}
                              onClick={() => {
                                assignMutation.reset();
                                removeMutation.mutate(judge.id);
                              }}
                            />
                          }
                        >
                          Remove judge
                        </AlertDialogAction>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </li>
              ))}
            </ul>
          ))}

        {removeMutation.isError && (
          <p role="alert" className="text-sm text-destructive">
            {getJuryError(removeMutation.error)}
          </p>
        )}

        {removeMutation.isSuccess && (
          <p role="status" className="text-sm text-muted-foreground">
            Judge removed successfully.
          </p>
        )}

        {canManage && judgesQuery.isSuccess && (
          <div className="space-y-3 border-t pt-4">
            <h3 className="font-medium">Assign a judge</h3>

            <input
              type="search"
              value={search}
              maxLength={50}
              placeholder="Search by username..."
              aria-label="Search users to assign as judges"
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              onChange={(event) => {
                setSearch(event.target.value);
                assignMutation.reset();
              }}
              disabled={isMutating}
            />

            {search.trim().length >= 2 &&
              (!showResults || searchQuery.isPending) && (
                <p role="status" className="text-sm text-muted-foreground">
                  Searching...
                </p>
              )}

            {showResults && searchQuery.isError && (
              <p role="alert" className="text-sm text-destructive">
                {getJuryError(searchQuery.error)}
              </p>
            )}

            {showResults &&
              searchQuery.isSuccess &&
              (searchQuery.data.length === 0 ? (
                <p className="text-sm text-muted-foreground">No users found.</p>
              ) : (
                <ul className="divide-y rounded-md border">
                  {searchQuery.data.map((user) => {
                    const assigned = assignedIds.has(user.id);

                    return (
                      <li
                        key={user.id}
                        className="flex flex-wrap items-center justify-between gap-3 p-3"
                      >
                        <div className="min-w-0 break-words">
                          <p className="font-medium">@{user.username}</p>

                          <p className="text-sm text-muted-foreground">
                            {user.fullName}
                          </p>
                        </div>

                        <Button
                          size="sm"
                          disabled={assigned || isMutating}
                          onClick={() => {
                            removeMutation.reset();
                            assignMutation.mutate(user.id);
                          }}
                        >
                          {assigned
                            ? "Assigned"
                            : assignMutation.isPending &&
                                assignMutation.variables === user.id
                              ? "Assigning..."
                              : "Assign"}
                        </Button>
                      </li>
                    );
                  })}
                </ul>
              ))}

            {assignMutation.isError && (
              <p role="alert" className="text-sm text-destructive">
                {getJuryError(assignMutation.error)}
              </p>
            )}

            {assignMutation.isSuccess && (
              <p role="status" className="text-sm text-muted-foreground">
                Judge assigned successfully.
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
