import { Link, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getMe } from "@/api/auth";
import { getHackathonById } from "@/api/hackathon-management";
import { isAxiosError } from "axios";
import HackathonDetailsState from "@/components/hackathon/HackathonDetailsState";
import { Spinner } from "@/components/ui/spinner";
import { buttonVariants } from "@/components/ui/button";
import { shouldRetryQuery } from "@/lib/query-retry";
import { parseHackathonId } from "@/lib/hackathon-id";
import {
  getHackathonCurrentPhase,
  getHackathonMembership,
  hackathonRegister,
  hackathonUnregister,
} from "@/api/hackathon";
import { Button } from "@/components/ui/button";
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
import { HackathonPhaseName } from "@/types/hackathon";

export default function HackathonDetails() {
  const { id } = useParams<{ id: string }>();
  const hackathonId = parseHackathonId(id);

  const { data: currentUser } = useQuery({
    queryKey: ["me"],
    queryFn: getMe,
    retry: false,
  });

  const queryClient = useQueryClient();

  const registerMutation = useMutation({
    mutationFn: async () => {
      if (hackathonId === null) {
        throw new Error("Invalid hackathon ID");
      }
      // await new Promise((resolve) => setTimeout(resolve, 3000));
      return hackathonRegister(hackathonId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["registration", hackathonId],
      });
    },
  });

  const unregisterMutation = useMutation({
    mutationFn: async () => {
      if (hackathonId === null) {
        throw new Error("Invalid hackathon ID");
      }
      // await new Promise((resolve) => setTimeout(resolve, 3000));
      return hackathonUnregister(hackathonId);
    },

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["registration", hackathonId],
      });
    },
  });

  const currentUserId = currentUser?.id;

  const { data: membership } = useQuery({
    queryKey: ["registration", hackathonId],
    queryFn: () => {
      if (hackathonId === null) {
        throw new Error("Invalid hackathon ID");
      }
      return getHackathonMembership(hackathonId);
    },
    enabled: hackathonId !== null,
    retry: shouldRetryQuery,
  });

  const { data: currentPhase } = useQuery({
    queryKey: ["phase", hackathonId],
    queryFn: () => {
      if (hackathonId === null) throw new Error("Invalid hackathon ID");

      return getHackathonCurrentPhase(hackathonId);
    },
    enabled: hackathonId !== null,
    retry: shouldRetryQuery,
  });

  const {
    data: hackathon,
    isPending,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["hackathons", hackathonId, currentUserId],
    queryFn: () => {
      if (hackathonId === null) {
        throw new Error("Invalid hackathon ID");
      }
      return getHackathonById(hackathonId);
    },
    enabled: currentUserId !== undefined && hackathonId !== null,
    retry: shouldRetryQuery,
  });

  if (hackathonId === null) {
    return <HackathonDetailsState variant="invalid" />;
  }

  if (isPending) {
    return (
      <section
        role="status"
        aria-live="polite"
        className="flex min-h-[60vh] flex-col items-center justify-center gap-4"
      >
        <Spinner />
        <p className="text-sm text-muted-foreground">
          Loading hackathon details...
        </p>
      </section>
    );
  }

  if (isError) {
    if (isAxiosError(error) && error.response?.status === 404) {
      return <HackathonDetailsState variant="not-found" />;
    }

    return (
      <HackathonDetailsState variant="error" onRetry={() => void refetch()} />
    );
  }

  return (
    <section className="mx-auto w-full max-w-4xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">{hackathon.title}</h1>

        <p className="mt-2 text-muted-foreground">
          Organised by {hackathon.organization_name}
        </p>
      </div>

      <div className="grid gap-4 rounded-lg border p-6 sm:grid-cols-2">
        <div>
          <h2 className="font-semibold">Start date</h2>
          <p className="mt-1 text-muted-foreground">
            {new Date(hackathon.start_at).toLocaleString("en-US", {
              dateStyle: "medium",
              timeStyle: "short",
            })}
          </p>
        </div>

        <div>
          <h2 className="font-semibold">End date</h2>
          <p className="mt-1 text-muted-foreground">
            {new Date(hackathon.end_at).toLocaleString("en-US", {
              dateStyle: "medium",
              timeStyle: "short",
            })}
          </p>
        </div>
      </div>

      <div className="mt-8">
        <h2 className="mb-3 text-xl font-semibold">Phase</h2>
        <p className="text-muted-foreground">
          {currentPhase?.phase_name
            ? currentPhase.phase_name.charAt(0).toUpperCase() +
              currentPhase.phase_name.toLowerCase().slice(1)
            : "No phase yet"}
        </p>
      </div>

      <div className="mt-8">
        <h2 className="mb-3 text-xl font-semibold">About this hackathon</h2>

        <p className="whitespace-pre-wrap break-words text-muted-foreground">
          {hackathon.description || "No description provided."}
        </p>
      </div>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          to="/hackathon-explorer"
          className={buttonVariants({
            variant: "outline",
            size: "lg",
          })}
        >
          Back to Explorer
        </Link>

        {hackathon.canEdit && (
          <Link
            to={`/hackathons/${hackathon.id}/edit`}
            state={{ returnTo: `/hackathons/${hackathon.id}` }}
            className={buttonVariants({ variant: "default", size: "lg" })}
          >
            Edit Hackathon
          </Link>
        )}

        {!hackathon.canEdit &&
          currentPhase?.phase_name === HackathonPhaseName.REGISTRATION &&
          (!membership?.isRegistered ? (
            <Button
              variant="default"
              size="lg"
              disabled={registerMutation.isPending}
              onClick={() => {
                unregisterMutation.mutate();
                registerMutation.mutate();
              }}
            >
              {registerMutation.isPending ? "Registering..." : "Register"}
            </Button>
          ) : (
            <AlertDialog>
              <AlertDialogTrigger
                render={<Button variant="default" size="lg" />}
              >
                Unregister
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    You will lose your membership in this hackathon.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  render={
                    <Button
                      variant="default"
                      size="lg"
                      disabled={unregisterMutation.isPending}
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
          ))}
      </div>
      {(registerMutation.isError || unregisterMutation.isError) && (
        <div className="mt-6 border w-fit p-2 rounded-md">
          {registerMutation.isError && (
            <p className="text-sm text-destructive">
              {isAxiosError(registerMutation.error)
                ? registerMutation.error.response?.data?.message
                : registerMutation.error.message}
            </p>
          )}
          {unregisterMutation.isError && (
            <p className="text-sm text-destructive text-left sm:text-center">
              {isAxiosError(unregisterMutation.error)
                ? unregisterMutation.error.response?.data?.message
                : unregisterMutation.error.message}
            </p>
          )}
        </div>
      )}
    </section>
  );
}
