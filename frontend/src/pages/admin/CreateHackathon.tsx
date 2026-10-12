import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { isAxiosError } from "axios";

import HackathonForm from "@/components/admin/HackathonForm";
import { createHackathon } from "@/api/hackathon-management";
import type { HackathonFormValues } from "@/schemas/hackathon.schema";
import type { HackathonPayload } from "@/types/hackathon-management";

function CreateHackathon() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: createHackathon,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["hackathons"] });
      navigate("/admin/hackathons");
    },
  });

  function handleCreate(data: HackathonFormValues) {
    const payload: HackathonPayload = {
      ...data,
      description: data.description.trim() || null,
      start_at: new Date(data.start_at).toISOString(),
      end_at: new Date(data.end_at).toISOString(),
    };

    mutation.mutate(payload);
  }

  return (
    <section className="mx-auto w-full max-w-3xl px-4 py-8">
      <h1 className="mb-6 text-3xl font-bold">Create Hackathon</h1>

      {mutation.isError && (
        <p role="alert" className="mb-4 text-sm text-red-600">
          {isAxiosError(mutation.error)
            ? (mutation.error.response?.data?.message?.toString() ??
              "Failed to create hackathon.")
            : "Failed to create hackathon."}
        </p>
      )}

      <HackathonForm
        onSubmit={handleCreate}
        isSubmitting={mutation.isPending}
      />
    </section>
  );
}

export default CreateHackathon;
