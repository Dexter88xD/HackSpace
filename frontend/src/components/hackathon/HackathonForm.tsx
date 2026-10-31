import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  hackathonSchema,
  type HackathonFormValues,
} from "@/schemas/hackathon.schema";
import { Link } from "react-router-dom";
import { HackathonFormProps } from "@/types/hackathon-management";

function toDateTimeLocal(iso: string): string {
  const date = new Date(iso);

  const pad = (value: number) => String(value).padStart(2, "0");

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function HackathonForm({
  hackathon,
  onSubmit,
  isSubmitting = false,
  cancelTo = "/hackathons",
}: HackathonFormProps) {
  const isEditing = !!hackathon;
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<HackathonFormValues>({
    resolver: zodResolver(hackathonSchema),
    defaultValues: {
      title: hackathon?.title ?? "",
      description: hackathon?.description ?? "",
      organizationName: hackathon?.organization_name ?? "",
      startAt: hackathon ? toDateTimeLocal(hackathon.start_at) : "",
      endAt: hackathon ? toDateTimeLocal(hackathon.end_at) : "",
    },
  });

  return (
    <form
      noValidate
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
    >
      <div className="space-y-2">
        <label
          htmlFor="title"
          className="block text-sm font-medium text-gray-700"
        >
          Hackathon Title
        </label>
        <input
          type="text"
          id="title"
          {...register("title")}
          aria-invalid={!!errors.title}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none"
        />
        {errors.title && (
          <p role="alert" className="text-sm text-red-600">
            {errors.title.message}
          </p>
        )}
      </div>
      <div className="space-y-2">
        <label
          htmlFor="description"
          className="block text-sm font-medium text-gray-700"
        >
          Description
        </label>
        <textarea
          id="description"
          {...register("description")}
          rows={4}
          placeholder="Describe your hackathon..."
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none"
        />
      </div>
      <div className="space-y-2">
        <label
          htmlFor="organizationName"
          className="block text-sm font-medium text-gray-700"
        >
          Organization name
        </label>
        <input
          type="text"
          id="organizationName"
          {...register("organizationName")}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none"
          aria-invalid={!!errors.organizationName}
        />
        {errors.organizationName && (
          <p role="alert" className="text-sm text-red-600">
            {errors.organizationName.message}
          </p>
        )}
      </div>
      <div className="space-y-2">
        <label
          htmlFor="startAt"
          className="block text-sm font-medium text-gray-700"
        >
          Start date
        </label>
        <input
          type="datetime-local"
          id="startAt"
          {...register("startAt")}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none"
          aria-invalid={!!errors.startAt}
        />
        {errors.startAt && (
          <p role="alert" className="text-sm text-red-600">
            {errors.startAt.message}
          </p>
        )}
      </div>
      <div className="space-y-2">
        <label
          htmlFor="endAt"
          className="block text-sm font-medium text-gray-700"
        >
          End date
        </label>
        <input
          type="datetime-local"
          id="endAt"
          {...register("endAt")}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none"
          aria-invalid={!!errors.endAt}
        />
        {errors.endAt && (
          <p role="alert" className="text-sm text-red-600">
            {errors.endAt.message}
          </p>
        )}
      </div>
      <div className="flex items-center justify-between gap-3">
        <Link
          to={cancelTo}
          className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </Link>

        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting
            ? "Saving..."
            : isEditing
              ? "Save Changes"
              : "Create Hackathon"}
        </button>
      </div>
    </form>
  );
}

export default HackathonForm;
