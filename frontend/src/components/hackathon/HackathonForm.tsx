
import { Fragment, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  hackathonSchema,
  PHASE_ORDER,
  type HackathonFormValues,
} from "@/schemas/hackathon.schema";
import { Link } from "react-router-dom";
import type { HackathonFormProps } from "@/types/hackathon-management";
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
  const [step, setStep] = useState<1 | 2>(1);

  const {
    register,
    handleSubmit,
    trigger,
    getValues,
    setError,
    formState: { errors },
  } = useForm<HackathonFormValues>({
    resolver: zodResolver(hackathonSchema),
    shouldUnregister: false,
    defaultValues: {
      title: hackathon?.title ?? "",
      description: hackathon?.description ?? "",
      organizationName: hackathon?.organizationName ?? "",
      startAt: hackathon ? toDateTimeLocal(hackathon.startAt) : "",
      endAt: hackathon ? toDateTimeLocal(hackathon.endAt) : "",
      phases: PHASE_ORDER.map((phaseName) => {
        const existingPhase = hackathon?.phases.find(
          (phase) => phase.phaseName === phaseName,
        );

        return {
          phaseName,
          description: existingPhase?.description ?? "",
          startAt: existingPhase ? toDateTimeLocal(existingPhase.startAt) : "",
          endAt: existingPhase ? toDateTimeLocal(existingPhase.endAt) : "",
        };
      }),
    },
  });

  const goToPhases = async () => {
    const valid = await trigger([
      "title",
      "description",
      "organizationName",
      "startAt",
      "endAt",
    ]);

    if (!valid) return;

    const { startAt, endAt } = getValues();

    if (new Date(startAt) >= new Date(endAt)) {
      setError("endAt", {
        type: "manual",
        message: "End date must be after start date",
      });
      return;
    }

    setStep(2);
  };

  const submitForm = handleSubmit(
    async (data) => {
      await onSubmit(data);
    },
    (validationErrors) => {
      if (
        validationErrors.title ||
        validationErrors.description ||
        validationErrors.organizationName ||
        validationErrors.startAt ||
        validationErrors.endAt
      ) {
        setStep(1);
      }
    },
  );

  return (
    <form
      noValidate
      onSubmit={submitForm}
      className="space-y-6 rounded-xl border border-border bg-card p-6 shadow-sm"
    >
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">
            {step === 1 ? "Hackathon Details" : "Phase Schedule"}
          </h2>

          <span className="text-sm text-muted-foreground">
            Step {step} of 2
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="h-1.5 rounded-full bg-primary" />

          <div
            className={`h-1.5 rounded-full ${
              step === 2 ? "bg-primary" : "bg-muted"
            }`}
          />
        </div>
      </div>

      {step === 1 && (
        <div className="space-y-6">
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

            {errors.description && (
              <p role="alert" className="text-sm text-destructive">
                {errors.description.message}
              </p>
            )}
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
        </div>
      )}

      {step === 2 && (
        <fieldset className="space-y-4">
          <legend className="text-lg font-semibold">
            Hackathon Phases
          </legend>

          <p className="text-sm text-muted-foreground">
            Configure the five phases in order. Each phase must fall
            within the hackathon dates, and phases must not overlap.
          </p>

          {PHASE_ORDER.map((phaseName, index) => (
            <div
              key={phaseName}
              className="space-y-4 rounded-lg border border-border p-4"
            >
              <h3 className="font-medium">
                {index + 1}. {phaseName.replace(/_/g, " ")}
              </h3>

              <input
                type="hidden"
                {...register(`phases.${index}.phaseName`)}
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor={`phase-${index}-start`}>
                    Start date
                  </Label>

                  <Input
                    id={`phase-${index}-start`}
                    type="datetime-local"
                    {...register(`phases.${index}.startAt`)}
                    aria-invalid={
                      !!errors.phases?.[index]?.startAt
                    }
                  />

                  {errors.phases?.[index]?.startAt && (
                    <p
                      role="alert"
                      className="text-sm text-destructive"
                    >
                      {errors.phases[index]?.startAt?.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`phase-${index}-end`}>
                    End date
                  </Label>

                  <Input
                    id={`phase-${index}-end`}
                    type="datetime-local"
                    {...register(`phases.${index}.endAt`)}
                    aria-invalid={
                      !!errors.phases?.[index]?.endAt
                    }
                  />

                  {errors.phases?.[index]?.endAt && (
                    <p
                      role="alert"
                      className="text-sm text-destructive"
                    >
                      {errors.phases[index]?.endAt?.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor={`phase-${index}-description`}>
                  Description (optional)
                </Label>

                <Textarea
                  id={`phase-${index}-description`}
                  {...register(`phases.${index}.description`)}
                  rows={2}
                  placeholder={`Describe the ${phaseName
                    .toLowerCase()
                    .replace(/_/g, " ")} phase...`}
                />
              </div>

              {errors.phases?.[index]?.phaseName && (
                <p
                  role="alert"
                  className="text-sm text-destructive"
                >
                  {errors.phases[index]?.phaseName?.message}
                </p>
              )}
            </div>
          ))}
        </fieldset>
      )}

      <div className="flex items-center justify-between gap-3">
        {step === 1 ? (
          <Fragment key="details-navigation">
            <Link
              to={cancelTo}
              className={buttonVariants({
                variant: "outline",
                size: "lg",
              })}
            >
              Cancel
            </Link>

            <Button
              type="button"
              size="lg"
              onClick={goToPhases}
            >
              Next: Configure Phases
            </Button>
          </Fragment>
        ) : (
          <Fragment key="phases-navigation">
            <Button
              type="button"
              variant="outline"
              size="lg"
              disabled={isSubmitting}
              onClick={() => setStep(1)}
            >
              Back
            </Button>

            <Button
              type="submit"
              size="lg"
              disabled={isSubmitting}
            >
              {isSubmitting
                ? "Saving..."
                : isEditing
                  ? "Save Changes"
                  : "Create Hackathon"}
            </Button>
          </Fragment>
        )}
      </div>
    </form>
  );
}

export default HackathonForm;
