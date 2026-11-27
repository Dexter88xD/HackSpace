import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { teamSchema, type TeamFormValues } from "@/schemas/team.schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

type CreateTeamFormProps = {
  onSubmit: (data: TeamFormValues) => void;
  isSubmitting: boolean;
  defaultValues?: TeamFormValues;
  submitLabel?: string;
  onCancel?: () => void;
};

function CreateTeamForm({
  onSubmit,
  isSubmitting,
  defaultValues = { name: "", description: "" },
  submitLabel = "Create Team",
  onCancel,
}: CreateTeamFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TeamFormValues>({
    resolver: zodResolver(teamSchema),
    defaultValues,
  });

  return (
    <form noValidate onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="name">
          Team name <span className="text-destructive">*</span>
        </Label>
        <Input
          type="text"
          id="name"
          {...register("name")}
          aria-required
          aria-invalid={!!errors.name}
          className="h-10"
        />
        {errors.name && (
          <p role="alert" className="text-sm text-destructive">
            {errors.name.message}
          </p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">
          Description <span className="text-muted-foreground">(optional)</span>
        </Label>
        <Textarea
          id="description"
          {...register("description")}
          aria-invalid={!!errors.description}
          rows={4}
          placeholder="What will your team build?"
          className="min-h-28"
        />
        {errors.description && (
          <p role="alert" className="text-sm text-destructive">
            {errors.description.message}
          </p>
        )}
      </div>
      <div className="flex justify-end gap-2">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
        )}

        <Button type="submit" size="lg" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : submitLabel}
        </Button>
      </div>
    </form>
  );
}

export default CreateTeamForm;
