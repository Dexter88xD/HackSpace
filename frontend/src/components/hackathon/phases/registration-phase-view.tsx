import { useMutation, useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { CalendarDays } from "lucide-react";
import { hackathonRegister, hackathonUnregister } from "@/api/hackathon";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
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
import { HackathonRoleName } from "@/types/hackathon";

type RegistrationPhaseViewProps = {
  hackathonId: number;
  registrationEndAt: string;
  isRegistered: boolean;
  membershipRole: HackathonRoleName | null;
  isMembershipPending: boolean;
  isMembershipError: boolean;
  isMembershipSuccess: boolean;
  canEdit: boolean;
  onRetryMembership: () => void;
};

export default function RegistrationPhaseView({
  hackathonId,
  registrationEndAt,
  isRegistered,
  membershipRole,
  isMembershipPending,
  isMembershipError,
  isMembershipSuccess,
  canEdit,
  onRetryMembership,
}: RegistrationPhaseViewProps) {
  const queryClient = useQueryClient();

  const registerMutation = useMutation({
    mutationFn: () => hackathonRegister(hackathonId),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["registration", hackathonId],
      });
    },
  });

  const unregisterMutation = useMutation({
    mutationFn: () => hackathonUnregister(hackathonId),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["registration", hackathonId],
      });

      void queryClient.invalidateQueries({
        queryKey: ["my-team", hackathonId],
      });
    },
  });

  const isMutating = registerMutation.isPending || unregisterMutation.isPending;

  const registrationDate = new Date(registrationEndAt).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  const mutationError = registerMutation.isError
    ? registerMutation.error
    : unregisterMutation.isError
      ? unregisterMutation.error
      : null;

  const showRegistrationActions =
    !canEdit &&
    (isMembershipPending ||
      isMembershipError ||
      !isMembershipSuccess ||
      !isRegistered ||
      membershipRole === HackathonRoleName.PARTICIPANT);

  return (
    <section
      aria-labelledby="registration-phase-title"
      className="rounded-xl border border-border p-4 sm:p-6"
    >
      <h2 id="registration-phase-title" className="text-lg font-semibold">
        Registration is open
      </h2>

      <p className="mt-1 text-sm text-muted-foreground">
        Registration is currently open. Join this hackathon to participate and
        manage your team.
      </p>

      <div className="mt-4 flex items-start gap-3">
        <CalendarDays
          className="mt-0.5 size-4 shrink-0 text-muted-foreground"
          aria-hidden="true"
        />

        <div>
          <p className="text-sm font-medium">Registration closes</p>
          <p className="text-sm text-muted-foreground">{registrationDate}</p>
        </div>
      </div>

      {showRegistrationActions && (
        <div className="mt-4 border-t border-border pt-4">
          {isMembershipPending ? (
            <div className="flex items-center gap-2" role="status">
              <Spinner />
              <p className="text-sm text-muted-foreground">
                Checking membership...
              </p>
            </div>
          ) : isMembershipError ? (
            <div className="flex flex-wrap items-center gap-3">
              <p role="alert" className="text-sm text-destructive">
                Unable to check your membership.
              </p>

              <Button variant="outline" onClick={onRetryMembership}>
                Retry
              </Button>
            </div>
          ) : !isMembershipSuccess ? (
            <p className="text-sm text-muted-foreground">
              Membership status is unavailable.
            </p>
          ) : !isRegistered ? (
            <Button
              disabled={isMutating}
              onClick={() => {
                unregisterMutation.reset();
                registerMutation.mutate();
              }}
            >
              {registerMutation.isPending ? "Registering..." : "Register"}
            </Button>
          ) : membershipRole === HackathonRoleName.PARTICIPANT ? (
            <AlertDialog>
              <AlertDialogTrigger
                render={<Button variant="default" disabled={isMutating} />}
              >
                Unregister
              </AlertDialogTrigger>

              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    You will lose your membership in this hackathon and leave
                    your team.
                  </AlertDialogDescription>
                </AlertDialogHeader>

                <AlertDialogCancel>Cancel</AlertDialogCancel>

                <AlertDialogAction
                  render={
                    <Button
                      variant="default"
                      disabled={isMutating}
                      onClick={() => {
                        registerMutation.reset();
                        unregisterMutation.mutate();
                      }}
                    />
                  }
                >
                  {unregisterMutation.isPending
                    ? "Unregistering..."
                    : "Unregister"}
                </AlertDialogAction>
              </AlertDialogContent>
            </AlertDialog>
          ) : null}

          {mutationError && (
            <p role="alert" className="mt-3 text-sm text-destructive">
              {isAxiosError(mutationError)
                ? String(
                    mutationError.response?.data?.message ??
                      mutationError.message,
                  )
                : mutationError.message}
            </p>
          )}
        </div>
      )}
    </section>
  );
}
