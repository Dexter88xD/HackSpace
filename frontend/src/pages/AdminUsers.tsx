import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import {
  deleteUser,
  getAdminUsers,
  updateUserRole,
  type AdminUser,
} from "@/api/admin";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { HackathonPagination } from "@/components/hackathon/HackathonPagination";

function getErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError<{ message?: string | string[] }>(error)) {
    const message = error.response?.data?.message;
    if (Array.isArray(message)) return message.join(". ");
    if (message) return message;
  }
  return fallback;
}

type PendingAction = { user: AdminUser; type: "role" | "delete" };

export default function AdminUsers() {
  const [page, setPage] = useState(1);
  const [pending, setPending] = useState<PendingAction | null>(null);
  const limit = 20;
  const queryClient = useQueryClient();

  const usersQuery = useQuery({
    queryKey: ["admin-users", { page, limit }],
    queryFn: () => getAdminUsers({ page, limit }),
  });

  const actionMutation = useMutation({
    mutationFn: async ({ user, type }: PendingAction) => {
      if (type === "delete") return deleteUser(user.id);
      await updateUserRole(
        user.id,
        user.role === "ROLE_ADMIN" ? "ROLE_USER" : "ROLE_ADMIN",
      );
    },
    onSuccess: () => {
      setPending(null);
      // "me" too, in case admins changed or deleted their own account.
      void queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      void queryClient.invalidateQueries({ queryKey: ["me"] });
    },
  });

  const openDialog = (user: AdminUser, type: PendingAction["type"]) => {
    actionMutation.reset();
    setPending({ user, type });
  };

  const username = pending?.user.username;
  const dialog =
    pending?.type === "delete"
      ? {
          title: `Delete ${username}?`,
          description:
            "They will no longer be able to sign in. Their teams, messages and submissions are kept.",
          confirm: "Delete",
        }
      : pending?.user.role === "ROLE_ADMIN"
        ? {
            title: `Remove ${username} as administrator?`,
            description: "They will lose access to platform administration.",
            confirm: "Remove admin",
          }
        : {
            title: `Make ${username} an administrator?`,
            description:
              "They will be able to manage all hackathons and users.",
            confirm: "Make admin",
          };
  const data = usersQuery.data;

  return (
    <section className="mx-auto w-full max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          User Administration
        </h1>
        <p className="mt-2 text-sm text-muted-foreground sm:text-base">
          View platform users, manage administrator access and delete accounts.
        </p>
      </div>

      {usersQuery.isPending ? (
        <p className="text-muted-foreground">Loading users...</p>
      ) : usersQuery.isError ? (
        <div className="space-y-2">
          <p role="alert" className="text-destructive">
            Could not load users.
          </p>
          <Button variant="outline" onClick={() => void usersQuery.refetch()}>
            Retry
          </Button>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
          <div className="flex items-center justify-between border-b border-border px-6 py-4">
            <h2 className="text-lg font-semibold text-foreground">Users</h2>
            <span className="text-sm text-muted-foreground">
              {usersQuery.data.total} users
            </span>
          </div>

          <table className="w-full text-left text-sm">
            <thead className="text-muted-foreground">
              <tr className="border-b border-border">
                <th className="px-6 py-3 font-medium">Username</th>
                <th className="px-6 py-3 font-medium">Full name</th>
                <th className="px-6 py-3 font-medium">Email</th>
                <th className="px-6 py-3 font-medium">Role</th>
                <th className="px-6 py-3 font-medium">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {usersQuery.data.data.map((user) => (
                <tr
                  key={user.id}
                  className="border-b border-border last:border-0"
                >
                  <td className="px-6 py-3 font-medium">{user.username}</td>
                  <td className="px-6 py-3">{user.fullName}</td>
                  <td className="px-6 py-3 break-all">{user.email}</td>
                  <td className="px-6 py-3">
                    {user.role === "ROLE_ADMIN" ? "Admin" : "User"}
                  </td>
                  <td className="space-x-2 px-6 py-3 text-right whitespace-nowrap">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openDialog(user, "role")}
                    >
                      {user.role === "ROLE_ADMIN"
                        ? "Remove admin"
                        : "Make admin"}
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => openDialog(user, "delete")}
                    >
                      Delete
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {data && data.total > limit && (
        <HackathonPagination
          currentPage={page}
          totalPages={Math.ceil(data.total / limit)}
          onPageChange={setPage}
        />
      )}

      <AlertDialog
        open={!!pending}
        onOpenChange={(open) => !open && setPending(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{dialog.title}</AlertDialogTitle>
            <AlertDialogDescription>{dialog.description}</AlertDialogDescription>
          </AlertDialogHeader>
          {actionMutation.isError && (
            <p role="alert" className="text-sm text-destructive">
              {getErrorMessage(
                actionMutation.error,
                "Couldn't update the user. Please try again.",
              )}
            </p>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={actionMutation.isPending}
              onClick={() => pending && actionMutation.mutate(pending)}
            >
              {actionMutation.isPending ? "Saving..." : dialog.confirm}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
