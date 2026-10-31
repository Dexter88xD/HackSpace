import { useNavigate, useParams } from "react-router-dom";
import HackathonForm from "@/components/hackathon/HackathonForm";
import type { HackathonFormValues } from "@/schemas/hackathon.schema";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getHackathonById, updateHackathon } from "@/api/hackathon-management";
import type { HackathonPayload } from "@/types/hackathon-management";
import { isAxiosError } from "axios";
import { getMe } from "@/api/auth";

function EditHackathon() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { id } = useParams();

  const hackathonId = Number(id);
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
  } = useQuery({
    queryKey: ["hackathons", hackathonId, currentUserId],
    queryFn: () => getHackathonById(hackathonId),
    enabled:
      currentUserId !== undefined &&
      Number.isSafeInteger(hackathonId) &&
      hackathonId > 0,
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

      navigate("/hackathons");
    },
  });

  if (!Number.isSafeInteger(hackathonId) || hackathonId <= 0) {
    return <p>Invalid hackathon ID.</p>;
  }

  if (isError) {
    if (isAxiosError(error) && error.response?.status === 404) {
      return <p>Hackathon not found.</p>;
    }

    return <p>Failed to load hackathon. Please try again.</p>;
  }

  if (isPending) {
    return <p>Loading hackathon...</p>;
  }

  if (!hackathon) {
    return <p>Hackathon not found.</p>;
  }

  if (!hackathon.canEdit) {
    return (
      <p role="alert">You don't have permission to edit this hackathon.</p>
    );
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
      />
    </section>
  );
}

export default EditHackathon;
