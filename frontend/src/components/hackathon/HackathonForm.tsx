import { Fragment, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
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
import { BYTES_PER_MIB } from "@/lib/file-size";

function toDateTimeLocal(iso: string): string {
  const date = new Date(iso);
  const pad = (value: number) => String(value).padStart(2, "0");

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function displayDateTime(value?: string): string {
  if (!value) return "Not set";
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "Invalid date";
  return date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
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
    control,
    handleSubmit,
    trigger,
    getValues,
    setError,
    setValue,
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
      settings: {
        minTeamMembers: hackathon?.settings.minTeamMembers ?? 1,
        maxTeamMembers: hackathon?.settings.maxTeamMembers ?? 5,
        filesLimit: hackathon?.settings.filesLimit ?? 1,
        fileMaxSize: hackathon
          ? hackathon.settings.fileMaxSize / BYTES_PER_MIB
          : 10,
      },
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

  const phases = useWatch({ control, name: "phases" });

  const goToPhases = async () => {
    const valid = await trigger([
      "title",
      "description",
      "organizationName",
      "startAt",
      "endAt",
      "settings",
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

    setValue("phases.0.startAt", startAt);
    setValue("phases.4.endAt", endAt);
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
        validationErrors.endAt ||
        validationErrors.settings
      ) {
        setStep(1);
      }
    },
  );

  return (
    <form
      noValidate
      onSubmit={submitForm}
      className="min-w-0 space-y-6 rounded-xl border border-border bg-card p-3 shadow-sm sm:p-6"
    >
      <div className="space-y-3">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
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
              className="h-10 min-w-0 w-full"
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
              className="h-10 min-w-0 w-full"
            />

            {errors.endAt && (
              <p role="alert" className="text-sm text-destructive">
                {errors.endAt.message}
              </p>
            )}
          </div>

          <fieldset className="space-y-4 border-t border-border pt-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="minTeamMembers">Minimum team members</Label>

                <Input
                  id="minTeamMembers"
                  type="number"
                  min={1}
                  step={1}
                  {...register("settings.minTeamMembers", {
                    valueAsNumber: true,
                  })}
                  aria-invalid={!!errors.settings?.minTeamMembers}
                />

                {errors.settings?.minTeamMembers && (
                  <p role="alert" className="text-sm text-destructive">
                    {errors.settings.minTeamMembers.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxTeamMembers">Maximum team members</Label>

                <Input
                  id="maxTeamMembers"
                  type="number"
                  min={1}
                  step={1}
                  {...register("settings.maxTeamMembers", {
                    valueAsNumber: true,
                  })}
                  aria-invalid={!!errors.settings?.maxTeamMembers}
                />

                {errors.settings?.maxTeamMembers && (
                  <p role="alert" className="text-sm text-destructive">
                    {errors.settings.maxTeamMembers.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="filesLimit">Maximum submission files</Label>

                <Input
                  id="filesLimit"
                  type="number"
                  min={1}
                  step={1}
                  {...register("settings.filesLimit", {
                    valueAsNumber: true,
                  })}
                  aria-invalid={!!errors.settings?.filesLimit}
                />

                <p className="text-xs text-muted-foreground">
                  Maximum files allowed per submission (at least 1).
                </p>

                {errors.settings?.filesLimit && (
                  <p role="alert" className="text-sm text-destructive">
                    {errors.settings.filesLimit.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="fileMaxSize">Maximum file size (MiB)</Label>

                <Input
                  id="fileMaxSize"
                  type="number"
                  min={1 / BYTES_PER_MIB}
                  step="any"
                  {...register("settings.fileMaxSize", {
                    valueAsNumber: true,
                  })}
                  aria-invalid={!!errors.settings?.fileMaxSize}
                />

                <p className="text-xs text-muted-foreground">
                  Maximum size of each uploaded file in MiB.
                </p>

                {errors.settings?.fileMaxSize && (
                  <p role="alert" className="text-sm text-destructive">
                    {errors.settings.fileMaxSize.message}
                  </p>
                )}
              </div>
            </div>
          </fieldset>
        </div>
      )}

      {step === 2 && (
        <fieldset className="space-y-3">
          <legend className="text-base font-semibold">Hackathon Phases</legend>
          <p className="text-sm text-muted-foreground">
            Set four phase boundaries. Each phase starts when the previous one
            ends; the hackathon dates define the first start and final end.
          </p>

          <div className="space-y-2">
            {PHASE_ORDER.map((phaseName, index) => (
              <div
                key={phaseName}
                className="grid min-w-0 gap-3 rounded-lg border border-border p-2 sm:p-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)_minmax(0,1.3fr)] md:items-start"
              >
                <input
                  type="hidden"
                  {...register(`phases.${index}.phaseName`)}
                />
                <input type="hidden" {...register(`phases.${index}.startAt`)} />

                <div className="min-w-0 space-y-1">
                  <h3 className="text-sm font-semibold">
                    {index + 1}. {phaseName.replace(/_/g, " ")}
                  </h3>
                  <p className="text-xs text-muted-foreground">Starts</p>
                  <p className="text-sm font-medium">
                    {displayDateTime(phases?.[index]?.startAt)}
                  </p>
                  {errors.phases?.[index]?.startAt && (
                    <p role="alert" className="text-xs text-destructive">
                      {errors.phases[index]?.startAt?.message}
                    </p>
                  )}
                  {errors.phases?.[index]?.phaseName && (
                    <p role="alert" className="text-xs text-destructive">
                      {errors.phases[index]?.phaseName?.message}
                    </p>
                  )}
                </div>

                <div className="min-w-0 space-y-1">
                  {index < PHASE_ORDER.length - 1 ? (
                    <>
                      <Label htmlFor={`phase-${index}-end`} className="text-xs">
                        Ends / Next phase starts
                      </Label>
                      <Input
                        id={`phase-${index}-end`}
                        type="datetime-local"
                        className="h-9 min-w-0 w-full"
                        {...register(`phases.${index}.endAt`, {
                          onChange: (event) => {
                            setValue(
                              `phases.${index + 1}.startAt`,
                              event.target.value,
                              { shouldDirty: true, shouldValidate: true },
                            );
                          },
                        })}
                        aria-invalid={!!errors.phases?.[index]?.endAt}
                      />
                    </>
                  ) : (
                    <>
                      <input
                        type="hidden"
                        {...register(`phases.${index}.endAt`)}
                      />
                      <p className="text-xs text-muted-foreground">Ends</p>
                      <p className="text-sm font-medium">
                        {displayDateTime(phases?.[index]?.endAt)}
                      </p>
                    </>
                  )}
                  {errors.phases?.[index]?.endAt && (
                    <p role="alert" className="text-xs text-destructive">
                      {errors.phases[index]?.endAt?.message}
                    </p>
                  )}
                </div>

                <div className="min-w-0 space-y-1">
                  <Label
                    htmlFor={`phase-${index}-description`}
                    className="text-xs"
                  >
                    Description (optional)
                  </Label>
                  <Textarea
                    id={`phase-${index}-description`}
                    {...register(`phases.${index}.description`)}
                    rows={1}
                    className="min-h-9 resize-y"
                    placeholder="Optional phase details..."
                  />
                </div>
              </div>
            ))}
          </div>
        </fieldset>
      )}

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
        {step === 1 ? (
          <Fragment key="details-navigation">
            <Link
              to={cancelTo}
              className={buttonVariants({
                variant: "outline",
                size: "lg",
                className: "w-full sm:w-auto",
              })}
            >
              Cancel
            </Link>

            <Button
              type="button"
              size="lg"
              className="w-full sm:w-auto"
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
              className="w-full sm:w-auto"
              disabled={isSubmitting}
              onClick={() => setStep(1)}
            >
              Back
            </Button>

            <Button
              type="submit"
              size="lg"
              className="w-full sm:w-auto"
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
