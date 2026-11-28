import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createScoringCriterion,
  getScoringCriteria,
  updateScoringCriterion,
  removeScoringCriterion,
} from "@/api/jury";
import type {
  ScoringCriterion,
  UpdateScoringCriterionPayload,
} from "@/types/jury";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { shouldRetryQuery } from "@/lib/query-retry";
import { getJuryError } from "./jury-error";
import { Pencil, Trash2 } from "lucide-react";
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

export function ScoringCriteriaManagement({ hackathonId, canManage }: Props) {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [editingCriterionId, setEditingCriterionId] = useState<number | null>(
    null,
  );

  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");

  const queryKey = ["scoring-criteria", hackathonId];

  const criteriaQuery = useQuery({
    queryKey,
    queryFn: () => getScoringCriteria(hackathonId),
    retry: shouldRetryQuery,
  });

  const createMutation = useMutation({
    mutationFn: () =>
      createScoringCriterion(hackathonId, {
        title: title.trim(),
        description: description.trim() || undefined,
      }),

    onSuccess: async () => {
      setTitle("");
      setDescription("");
      await queryClient.invalidateQueries({ queryKey });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({
      criterionId,
      payload,
    }: {
      criterionId: number;
      payload: UpdateScoringCriterionPayload;
    }) => updateScoringCriterion(hackathonId, criterionId, payload),

    onSuccess: async () => {
      setEditingCriterionId(null);
      setEditTitle("");
      setEditDescription("");

      await queryClient.invalidateQueries({ queryKey });
    },
  });

  const removeMutation = useMutation({
    mutationFn: (criterionId: number) =>
      removeScoringCriterion(hackathonId, criterionId),

    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey });
    },
  });

  const isMutating =
    createMutation.isPending ||
    updateMutation.isPending ||
    removeMutation.isPending;

  function startEditing(criterion: ScoringCriterion) {
    createMutation.reset();
    updateMutation.reset();
    removeMutation.reset();

    setEditingCriterionId(criterion.id);
    setEditTitle(criterion.title);
    setEditDescription(criterion.description ?? "");
  }

  function cancelEditing() {
    setEditingCriterionId(null);
    setEditTitle("");
    setEditDescription("");

    updateMutation.reset();
  }

  const criteria = criteriaQuery.data ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between gap-2">
          <span>Scoring criteria</span>

          {criteriaQuery.isSuccess && (
            <span className="text-xs font-normal text-muted-foreground">
              {criteria.length} total
            </span>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Equal weight · 0–10 points per criterion
        </p>

        {criteriaQuery.isPending && <p role="status">Loading criteria...</p>}

        {criteriaQuery.isError && (
          <div className="space-y-2">
            <p role="alert" className="text-sm text-destructive">
              {getJuryError(criteriaQuery.error)}
            </p>

            <Button
              variant="outline"
              onClick={() => void criteriaQuery.refetch()}
            >
              Retry
            </Button>
          </div>
        )}

        {criteriaQuery.isSuccess &&
          (criteria.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No scoring criteria defined yet.
            </p>
          ) : (
            <ul className="divide-y rounded-md border">
              {criteria.map((criterion) => (
                <li key={criterion.id} className="space-y-3 p-3">
                  {canManage && editingCriterionId === criterion.id ? (
                    <form
                      className="space-y-3"
                      onSubmit={(event) => {
                        event.preventDefault();

                        if (!canManage || !editTitle.trim() || isMutating) {
                          return;
                        }

                        updateMutation.mutate({
                          criterionId: criterion.id,
                          payload: {
                            title: editTitle.trim(),
                            description: editDescription.trim() || null,
                          },
                        });
                      }}
                    >
                      <label className="block space-y-2 text-sm">
                        <span>Title</span>

                        <input
                          required
                          value={editTitle}
                          maxLength={100}
                          disabled={isMutating}
                          className="w-full rounded-md border bg-background px-3 py-2"
                          onChange={(event) => {
                            setEditTitle(event.target.value);
                            updateMutation.reset();
                          }}
                        />
                      </label>

                      <label className="block space-y-2 text-sm">
                        <span>Description (optional)</span>

                        <textarea
                          value={editDescription}
                          rows={2}
                          disabled={isMutating}
                          className="w-full resize-y rounded-md border bg-background px-3 py-2"
                          onChange={(event) => {
                            setEditDescription(event.target.value);
                            updateMutation.reset();
                          }}
                        />
                      </label>

                      <div className="flex flex-wrap justify-end gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={isMutating}
                          onClick={cancelEditing}
                        >
                          Cancel
                        </Button>

                        <Button
                          type="submit"
                          size="sm"
                          disabled={!editTitle.trim() || isMutating}
                        >
                          {updateMutation.isPending
                            ? "Saving..."
                            : "Save changes"}
                        </Button>
                      </div>

                      {updateMutation.isError && (
                        <p role="alert" className="text-sm text-destructive">
                          {getJuryError(updateMutation.error)}
                        </p>
                      )}
                    </form>
                  ) : (
                    <>
                      <h3 className="break-words font-medium">
                        {criterion.title}
                      </h3>

                      {criterion.description && (
                        <p className="whitespace-pre-wrap break-words text-sm text-muted-foreground">
                          {criterion.description}
                        </p>
                      )}

                      {canManage && (
                        <div className="flex flex-wrap justify-end gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={isMutating || editingCriterionId !== null}
                            aria-label={`Edit criterion ${criterion.title}`}
                            onClick={() => startEditing(criterion)}
                          >
                            <Pencil className="size-4" aria-hidden="true" />
                            Edit
                          </Button>

                          <AlertDialog>
                            <AlertDialogTrigger
                              render={
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  disabled={
                                    isMutating || editingCriterionId !== null
                                  }
                                  className="text-destructive"
                                  aria-label={`Delete criterion ${criterion.title}`}
                                />
                              }
                            >
                              <Trash2 className="size-4" aria-hidden="true" />

                              {removeMutation.isPending &&
                              removeMutation.variables === criterion.id
                                ? "Deleting..."
                                : "Delete"}
                            </AlertDialogTrigger>

                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Delete scoring criterion?
                                </AlertDialogTitle>

                                <AlertDialogDescription>
                                  "{criterion.title}" will be permanently
                                  removed from this hackathon. This action
                                  cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>

                              <AlertDialogCancel>Cancel</AlertDialogCancel>

                              <AlertDialogAction
                                render={
                                  <Button
                                    variant="destructive"
                                    disabled={isMutating || !canManage}
                                    onClick={() => {
                                      createMutation.reset();
                                      updateMutation.reset();
                                      removeMutation.mutate(criterion.id);
                                    }}
                                  />
                                }
                              >
                                Delete criterion
                              </AlertDialogAction>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      )}
                    </>
                  )}
                </li>
              ))}
            </ul>
          ))}

        {updateMutation.isSuccess && (
          <p role="status" className="text-sm text-muted-foreground">
            Criterion updated successfully.
          </p>
        )}

        {removeMutation.isError && (
          <p role="alert" className="text-sm text-destructive">
            {getJuryError(removeMutation.error)}
          </p>
        )}

        {removeMutation.isSuccess && (
          <p role="status" className="text-sm text-muted-foreground">
            Criterion deleted successfully.
          </p>
        )}

        {canManage && criteriaQuery.isSuccess && (
          <form
            className="space-y-4 border-t pt-4"
            onSubmit={(event) => {
              event.preventDefault();

              if (
                canManage &&
                title.trim() &&
                !isMutating &&
                editingCriterionId === null
              ) {
                updateMutation.reset();
                removeMutation.reset();
                createMutation.mutate();
              }
            }}
          >
            <h3 className="font-medium">Add a scoring criterion</h3>

            <label className="block space-y-2 text-sm">
              <span>Title</span>

              <input
                required
                value={title}
                maxLength={100}
                disabled={isMutating || editingCriterionId !== null}
                placeholder="e.g. Innovation"
                className="w-full rounded-md border bg-background px-3 py-2"
                onChange={(event) => {
                  setTitle(event.target.value);
                  createMutation.reset();
                }}
              />
            </label>

            <label className="block space-y-2 text-sm">
              <span>Description (optional)</span>

              <textarea
                value={description}
                rows={2}
                disabled={isMutating || editingCriterionId !== null}
                placeholder="Describe what judges should evaluate..."
                className="w-full resize-y rounded-md border bg-background px-3 py-2"
                onChange={(event) => {
                  setDescription(event.target.value);
                  createMutation.reset();
                }}
              />
            </label>

            <Button
              type="submit"
              disabled={
                !title.trim() || isMutating || editingCriterionId !== null
              }
            >
              {createMutation.isPending ? "Adding..." : "Add criterion"}
            </Button>

            {createMutation.isError && (
              <p role="alert" className="text-sm text-destructive">
                {getJuryError(createMutation.error)}
              </p>
            )}

            {createMutation.isSuccess && (
              <p role="status" className="text-sm text-muted-foreground">
                Criterion added successfully.
              </p>
            )}
          </form>
        )}
      </CardContent>
    </Card>
  );
}
