import { useNavigate, useParams } from "react-router-dom";
import HackathonForm from "@/components/hackathon/HackathonForm";
import type { HackathonFormValues } from "@/schemas/hackathon.schema";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getHackathonById, updateHackathon } from "@/api/hackathon-management";
import type { HackathonPayload } from "@/types/hackathon-management";
import { isAxiosError } from "axios";
import { getMe } from "@/api/auth";
import { useLocation } from "react-router-dom";
import HackathonDetailsState from "@/components/hackathon/HackathonDetailsState";
import { Spinner } from "@/components/ui/spinner";

function EditHackathon() {
  const location = useLocation();

  const returnTo =
    typeof location.state?.returnTo === "string" &&
    location.state.returnTo.startsWith("/") &&
    !location.state.returnTo.startsWith("//")
      ? location.state.returnTo
      : "/hackathons";
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { id } = useParams<{ id: string }>();

  const isValidId = id !== undefined && /^[1-9]\d*$/.test(id);
  const hackathonId = isValidId ? Number(id) : NaN;

  const validHackathonId = isValidId && Number.isSafeInteger(hackathonId);
  const { data: currentUser } = useQuery({
    queryKey: ["me"],
    queryFn: getMe,
    retry: false,
  });

  const currentUserId = currentUser?.id;

  const {
    data: hackathon,
    isPending,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["hackathons", hackathonId, currentUserId],
    queryFn: () => getHackathonById(hackathonId),
    enabled: currentUserId !== undefined && validHackathonId,
    retry: (failureCount, error) => {
      if (isAxiosError(error)) {
        const status = error.response?.status;

        if (status && status >= 400 && status < 500) {
          return false;
        }
      }

      return failureCount < 2;
    },
  });
  const mutation = useMutation({
    mutationFn: (payload: HackathonPayload) =>
      updateHackathon(hackathonId, payload),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["management-hackathons"] }),
        queryClient.invalidateQueries({ queryKey: ["hackathons"] }),
      ]);

      navigate(`/hackathons/${hackathonId}`);
    },
  });

  if (!validHackathonId) {
    return <HackathonDetailsState variant="invalid" />;
  }

  if (isError) {
    if (isAxiosError(error) && error.response?.status === 404) {
      return <HackathonDetailsState variant="not-found" />;
    }

    if (isAxiosError(error) && error.response?.status === 403) {
      return <HackathonDetailsState variant="forbidden" />;
    }

    return (
      <HackathonDetailsState variant="error" onRetry={() => void refetch()} />
    );
  }

  if (isPending) {
    return (
      <section
        role="status"
        aria-live="polite"
        className="flex min-h-[60vh] flex-col items-center justify-center gap-4"
      >
        <Spinner />
        <p className="text-sm text-muted-foreground">Loading hackathon...</p>
      </section>
    );
  }

  if (!hackathon) {
    return <HackathonDetailsState variant="not-found" />;
  }

  if (!hackathon.canEdit) {
    return <HackathonDetailsState variant="forbidden" />;
  }

  function handleEdit(data: HackathonFormValues) {
    const payload: HackathonPayload = {
      ...data,
      description: data.description.trim() || null,
      startAt: new Date(data.startAt).toISOString(),
      endAt: new Date(data.endAt).toISOString(),
    };

    mutation.mutate(payload);
  }

  return (
    <section className="mx-auto w-full max-w-3xl px-4 py-8">
      <h1 className="mb-6 text-3xl font-bold">Edit Hackathon</h1>
      {mutation.isError && (
        <p role="alert" className="mb-4 text-sm text-red-600">
          {isAxiosError(mutation.error)
            ? (() => {
                const message = mutation.error.response?.data?.message;

                return Array.isArray(message)
                  ? message.join(", ")
                  : typeof message === "string"
                    ? message
                    : "Failed to update hackathon. Please try again.";
              })()
            : "Failed to update hackathon. Please try again."}
        </p>
      )}

      <HackathonForm
        hackathon={hackathon}
        onSubmit={handleEdit}
        isSubmitting={mutation.isPending}
        cancelTo={returnTo}
      />
    </section>
  );
}

export default EditHackathon;
