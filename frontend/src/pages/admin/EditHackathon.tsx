import { useNavigate, useParams } from "react-router-dom";
import HackathonForm from "@/components/admin/HackathonForm";
import type { HackathonFormValues } from "@/schemas/hackathon.schema";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getHackathonById, updateHackathon } from "@/api/hackathon-management";
import type { HackathonPayload } from "@/types/hackathon-management";
import { isAxiosError } from "axios";

function EditHackathon() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { id } = useParams();

  const hackathonId = Number(id);

  const {
    data: hackathon,
    isPending,
    isError,
    error,
  } = useQuery({
    queryKey: ["hackathons", hackathonId],
    queryFn: () => getHackathonById(hackathonId),
    enabled: Number.isSafeInteger(hackathonId) && hackathonId > 0,
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
      await queryClient.invalidateQueries({
        queryKey: ["hackathons"],
      });
      navigate("/admin/hackathons");
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
          Failed to update hackathon. Please try again.
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
