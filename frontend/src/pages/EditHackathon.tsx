import { useLocation, useNavigate, useParams } from "react-router-dom";
import HackathonForm from "@/components/hackathon/HackathonForm";
import type { HackathonFormValues } from "@/schemas/hackathon.schema";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getHackathonById, updateHackathon } from "@/api/hackathon-management";
import type {
  HackathonPhasePayload,
  UpdateHackathonPayload,
} from "@/types/hackathon-management";
import { HackathonPhaseName } from "@/types/hackathon";
import { isAxiosError } from "axios";
import { getMe } from "@/api/auth";
import HackathonDetailsState from "@/components/hackathon/HackathonDetailsState";
import { Spinner } from "@/components/ui/spinner";
import { getReturnTo } from "@/lib/navigation";
import { shouldRetryQuery } from "@/lib/query-retry";
import { parseHackathonId } from "@/lib/hackathon-id";

function EditHackathon() {
  const location = useLocation();
  const returnTo = getReturnTo(location.state?.returnTo);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { id } = useParams<{ id: string }>();
  const hackathonId = parseHackathonId(id);

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
    queryFn: () => {
      if (hackathonId === null) {
        throw new Error("Invalid hackathon ID");
      }

      return getHackathonById(hackathonId);
    },
    enabled: currentUserId !== undefined && hackathonId !== null,
    retry: shouldRetryQuery,
  });

  const mutation = useMutation({
    mutationFn: (payload: UpdateHackathonPayload) => {
      if (hackathonId === null) {
        throw new Error("Invalid hackathon ID");
      }

      return updateHackathon(hackathonId, payload);
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["management-hackathons"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["hackathons"],
        }),
      ]);

      navigate(returnTo);
    },
  });

  const fallbackMessage = "Failed to update hackathon. Please try again.";

  let updateErrorMessage = fallbackMessage;

  if (mutation.isError && isAxiosError(mutation.error)) {
    const message = mutation.error.response?.data?.message;

    if (Array.isArray(message)) {
      updateErrorMessage = message.map(String).join(", ");
    } else if (typeof message === "string") {
      updateErrorMessage = message;
    }
  }

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
        <p className="text-sm text-muted-foreground">Loading hackathon...</p>
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

  if (!hackathon.canEdit) {
    return <HackathonDetailsState variant="forbidden" />;
  }

  function handleEdit(data: HackathonFormValues) {
    if (!hackathon) return;

    const changedPhases: HackathonPhasePayload[] = [];

    for (const phase of data.phases) {
      const existingPhase = hackathon.phases.find(
        (saved) => saved.phaseName === phase.phaseName,
      );

      if (!existingPhase) {
        throw new Error(`Saved phase ${phase.phaseName} was not found`);
      }

      const startAt = new Date(phase.startAt).toISOString();
      const endAt = new Date(phase.endAt).toISOString();
      const description = phase.description.trim() || null;

      const datesChanged =
        startAt !== new Date(existingPhase.startAt).toISOString() ||
        endAt !== new Date(existingPhase.endAt).toISOString();

      const descriptionChanged = description !== existingPhase.description;

      if (datesChanged || descriptionChanged) {
        changedPhases.push({
          phaseName: HackathonPhaseName[phase.phaseName],
          description,
          startAt,
          endAt,
        });
      }
    }

    const payload: UpdateHackathonPayload = {
      title: data.title,
      description: data.description.trim() || null,
      organizationName: data.organizationName,
      startAt: new Date(data.startAt).toISOString(),
      endAt: new Date(data.endAt).toISOString(),
    };

    if (changedPhases.length > 0) {
      payload.phases = changedPhases;
    }

    mutation.mutate(payload);
  }

  return (
    <section className="mx-auto w-full max-w-3xl px-4 py-8">
      <h1 className="mb-6 text-3xl font-bold">Edit Hackathon</h1>

      {mutation.isError && (
        <p role="alert" className="mb-4 text-sm text-destructive">
          {updateErrorMessage}
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
