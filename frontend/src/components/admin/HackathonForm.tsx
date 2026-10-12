import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  hackathonSchema,
  type HackathonFormValues,
} from "@/schemas/hackathon.schema";
import type { Hackathon } from "@/types/hackathon";
import { Link } from "react-router-dom";

type HackathonFormProps = {
  hackathon?: Hackathon;
};

function toDateTimeLocal(iso: string): string {
  const date = new Date(iso);

  const pad = (value: number) => String(value).padStart(2, "0");

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function HackathonForm({ hackathon }: HackathonFormProps) {
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
      organization_name: hackathon?.organization_name ?? "",
      start_at: hackathon ? toDateTimeLocal(hackathon.start_at) : "",
      end_at: hackathon ? toDateTimeLocal(hackathon.end_at) : "",
    },
  });

  function onSubmit(data: HackathonFormValues) {
    console.log(data);
  }
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
          htmlFor="organization_name"
          className="block text-sm font-medium text-gray-700"
        >
          Organization name
        </label>
        <input
          type="text"
          id="organization_name"
          {...register("organization_name")}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none"
          aria-invalid={!!errors.organization_name}
        />
        {errors.organization_name && (
          <p role="alert" className="text-sm text-red-600">
            {errors.organization_name.message}
          </p>
        )}
      </div>
      <div className="space-y-2">
        <label
          htmlFor="start_at"
          className="block text-sm font-medium text-gray-700"
        >
          Start date
        </label>
        <input
          type="datetime-local"
          id="start_at"
          {...register("start_at")}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none"
          aria-invalid={!!errors.start_at}
        />
        {errors.start_at && (
          <p role="alert" className="text-sm text-red-600">
            {errors.start_at.message}
          </p>
        )}
      </div>
      <div className="space-y-2">
        <label
          htmlFor="end_at"
          className="block text-sm font-medium text-gray-700"
        >
          End date
        </label>
        <input
          type="datetime-local"
          id="end_at"
          {...register("end_at")}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none"
          aria-invalid={!!errors.end_at}
        />
        {errors.end_at && (
          <p role="alert" className="text-sm text-red-600">
            {errors.end_at.message}
          </p>
        )}
      </div>
      <div className="flex items-center justify-between gap-3">
        <Link
          to="/admin/hackathons"
          className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </Link>

        <button
          type="submit"
          className="rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-700"
        >
          {isEditing ? "Save Changes" : "Create Hackathon"}
        </button>
      </div>
    </form>
  );
}

export default HackathonForm;
