import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation, useNavigate } from "react-router-dom";
import { isAxiosError } from "axios";
import HackathonForm from "@/components/hackathon/HackathonForm";
import { createHackathon } from "@/api/hackathon-management";
import type { HackathonFormValues } from "@/schemas/hackathon.schema";
import type { HackathonPayload } from "@/types/hackathon-management";
import { getReturnTo } from "@/lib/navigation";

function CreateHackathon() {
  const location = useLocation();
  const returnTo = getReturnTo(location.state?.returnTo);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: createHackathon,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["management-hackathons"] }),
        queryClient.invalidateQueries({ queryKey: ["hackathons"] }),
      ]);

      navigate("/hackathons");
    },
  });

  function handleCreate(data: HackathonFormValues) {
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
      <h1 className="mb-6 text-3xl font-bold">Create Hackathon</h1>

      {mutation.isError && (
        <p role="alert" className="mb-4 text-sm text-destructive">
          {isAxiosError(mutation.error)
            ? (mutation.error.response?.data?.message?.toString() ??
              "Failed to create hackathon.")
            : "Failed to create hackathon."}
        </p>
      )}

      <HackathonForm
        onSubmit={handleCreate}
        isSubmitting={mutation.isPending}
        cancelTo={returnTo}
      />
    </section>
  );
}

export default CreateHackathon;
