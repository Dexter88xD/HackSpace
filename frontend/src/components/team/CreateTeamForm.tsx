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
};

function CreateTeamForm({ onSubmit, isSubmitting }: CreateTeamFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TeamFormValues>({
    resolver: zodResolver(teamSchema),
    defaultValues: { name: "", description: "" },
  });

  return (
    <form
      noValidate
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-6 rounded-xl border border-border bg-card p-6 shadow-sm"
    >
      <div className="space-y-2">
        <Label htmlFor="name">Team name</Label>
        <Input
          type="text"
          id="name"
          {...register("name")}
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
        <Label htmlFor="description">Description</Label>
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
      <div className="flex justify-end">
        <Button type="submit" size="lg" disabled={isSubmitting}>
          {isSubmitting ? "Creating..." : "Create Team"}
        </Button>
      </div>
    </form>
  );
}

export default CreateTeamForm;
