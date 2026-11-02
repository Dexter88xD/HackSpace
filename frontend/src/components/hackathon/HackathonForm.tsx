import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  hackathonSchema,
  type HackathonFormValues,
} from "@/schemas/hackathon.schema";
import { Link } from "react-router-dom";
import { HackathonFormProps } from "@/types/hackathon-management";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

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
      className="space-y-6 rounded-xl border border-border bg-card p-6 shadow-sm"
    >
      <div className="space-y-2">
        <Label htmlFor="title">Hackathon Title</Label>
        <Input
          type="text"
          id="title"
          {...register("title")}
          aria-invalid={!!errors.title}
          className="h-10"
        />
        {errors.title && (
          <p role="alert" className="text-sm text-destructive">
            {errors.title.message}
          </p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          {...register("description")}
          rows={4}
          placeholder="Describe your hackathon..."
          className="min-h-28"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="organizationName">Organization name</Label>
        <Input
          type="text"
          id="organizationName"
          {...register("organizationName")}
          aria-invalid={!!errors.organizationName}
          className="h-10"
        />
        {errors.organizationName && (
          <p role="alert" className="text-sm text-destructive">
            {errors.organizationName.message}
          </p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="startAt">Start date</Label>
        <Input
          type="datetime-local"
          id="startAt"
          {...register("startAt")}
          aria-invalid={!!errors.startAt}
          className="h-10"
        />
        {errors.startAt && (
          <p role="alert" className="text-sm text-destructive">
            {errors.startAt.message}
          </p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="endAt">End date</Label>
        <Input
          type="datetime-local"
          id="endAt"
          {...register("endAt")}
          aria-invalid={!!errors.endAt}
          className="h-10"
        />
        {errors.endAt && (
          <p role="alert" className="text-sm text-destructive">
            {errors.endAt.message}
          </p>
        )}
      </div>
      <div className="flex items-center justify-between gap-3">
        <Link
          to={cancelTo}
          className={buttonVariants({
            variant: "outline",
            size: "lg",
          })}
        >
          Cancel
        </Link>

        <Button type="submit" size="lg" disabled={isSubmitting}>
          {isSubmitting
            ? "Saving..."
            : isEditing
              ? "Save Changes"
              : "Create Hackathon"}
        </Button>
      </div>
    </form>
  );
}

export default HackathonForm;
