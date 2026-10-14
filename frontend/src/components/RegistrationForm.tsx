import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  registerSchema,
  type RegisterFormData,
} from "../schemas/register.schema";
import { Button } from "./ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useMutation } from "@tanstack/react-query";
import { register, startOAuth } from "@/api/auth";
import { Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Link } from "react-router-dom";

// Registration form that validates user input with React Hook Form and Zod, submits the registration
// request through TanStack Query, displays validation and loading states, and redirects the user to
// the OTP verification page after successful registration while storing their email in sessionStorage.
export function RegistrationForm({
  ...props
}: React.ComponentProps<typeof Card>) {
  const navigate = useNavigate();
  const form = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });
  const registerMutation = useMutation({
    mutationFn: register,
    onSuccess: (_, variables) => {
      sessionStorage.setItem("verificationEmail", variables.email);
      navigate("/verify-otp");
    },
  });
  const onSubmit = (data: RegisterFormData) => {
    registerMutation.mutate(data);
  };
  return (
    <Card className="border-primary/10 shadow-lg shadow-primary/5" {...props}>
      <CardHeader className="text-center">
        <CardTitle>Create an account</CardTitle>
        <CardDescription>
          Join HackSpace and start building with your community
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit((data) => onSubmit(data))}>
          <FieldGroup className="gap-3">
            <div className="grid gap-5 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="full-name">Full Name</FieldLabel>
                <Input
                  id="full-name"
                  type="text"
                  placeholder="Laarbi Lhilali"
                  autoComplete="name"
                  {...form.register("fullName")}
                />
                {form.formState.errors.fullName && (
                  <FieldError>
                    {form.formState.errors.fullName.message}
                  </FieldError>
                )}
              </Field>
              <Field>
                <FieldLabel htmlFor="username">Username</FieldLabel>
                <Input
                  id="username"
                  type="text"
                  placeholder="pseudo"
                  autoComplete="username"
                  {...form.register("username")}
                />
                {form.formState.errors.username && (
                  <FieldError>
                    {form.formState.errors.username.message}
                  </FieldError>
                )}
              </Field>
            </div>
            <Field>
              <FieldLabel htmlFor="email">Email</FieldLabel>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                {...form.register("email")}
              />
              {form.formState.errors.email && (
                <FieldError>{form.formState.errors.email.message}</FieldError>
              )}
            </Field>
            <Field>
              <FieldLabel htmlFor="password">Password</FieldLabel>
              <Input
                id="password"
                type="password"
                placeholder="Create a strong password"
                autoComplete="new-password"
                {...form.register("password")}
              />
              <FieldDescription>
                Must be at least 8 characters long.
              </FieldDescription>
              {form.formState.errors.password && (
                <FieldError>
                  {form.formState.errors.password.message}
                </FieldError>
              )}
            </Field>
            <Field>
              <FieldLabel htmlFor="confirm-password">
                Confirm Password
              </FieldLabel>
              <Input
                id="confirm-password"
                type="password"
                placeholder="Repeat your password"
                autoComplete="new-password"
                {...form.register("confirmPassword")}
              />
            </Field>
            {form.formState.errors.confirmPassword && (
              <FieldError>
                {form.formState.errors.confirmPassword.message}
              </FieldError>
            )}
            {registerMutation.isError && (
              <FieldError>
                {axios.isAxiosError(registerMutation.error)
                  ? registerMutation.error.response?.data?.message
                  : "Something went wrong"}
              </FieldError>
            )}
            <FieldGroup>
              <Field>
                <Button
                  className="mt-1 shadow-sm shadow-primary/20 transition-all hover:-translate-y-0.5 hover:shadow-md hover:shadow-primary/25"
                  type="submit"
                  disabled={registerMutation.isPending}
                >
                  {registerMutation.isPending && (
                    <Loader2 className="animate-spin" />
                  )}
                  {registerMutation.isPending
                    ? "Creating..."
                    : "Create Account"}
                </Button>
                <FieldSeparator className="my-2 *:data-[slot=field-separator-content]:bg-card">
                  Or
                </FieldSeparator>
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    type="button"
                    aria-label="Sign up with Google"
                    title="Sign up with Google"
                    className="h-10 w-full justify-start border-border border-l-4 border-l-[#4285f4] bg-card px-3 text-foreground transition-all hover:-translate-y-0.5 hover:bg-[#4285f4]/5 hover:shadow-md"
                    onClick={() => startOAuth("google")}
                  >
                    <svg
                      aria-hidden="true"
                      viewBox="0 0 24 24"
                      className="size-4"
                    >
                      <path
                        d="M21.35 12.27c0-.78-.07-1.54-.2-2.27H12v4.3h5.22a4.47 4.47 0 0 1-1.94 2.93v2.43h3.14c1.84-1.69 2.93-4.18 2.93-7.39Z"
                        fill="#4285f4"
                      />
                      <path
                        d="M12 21.8c2.63 0 4.84-.87 6.45-2.36l-3.14-2.43c-.87.58-1.98.92-3.31.92-2.55 0-4.71-1.72-5.49-4.03H3.27v2.51A9.74 9.74 0 0 0 12 21.8Z"
                        fill="#34a853"
                      />
                      <path
                        d="M6.51 13.9A5.85 5.85 0 0 1 6.2 12c0-.66.11-1.3.31-1.9V7.59H3.27A9.76 9.76 0 0 0 2.25 12c0 1.59.38 3.1 1.02 4.41l3.24-2.51Z"
                        fill="#fbbc05"
                      />
                      <path
                        d="M12 6.07c1.43 0 2.72.49 3.73 1.46l2.8-2.8C16.84 3.15 14.63 2.2 12 2.2a9.74 9.74 0 0 0-8.73 5.39l3.24 2.51C7.29 7.79 9.45 6.07 12 6.07Z"
                        fill="#ea4335"
                      />
                    </svg>
                    Continue with Google
                  </Button>
                  <Button
                    variant="outline"
                    type="button"
                    aria-label="Sign up with 42 Intra"
                    title="Sign up with 42 Intra"
                    className="h-10 w-full justify-start border-border border-l-4 border-l-[#00babc] bg-card px-3 text-foreground transition-all hover:-translate-y-0.5 hover:bg-[#00babc]/5 hover:shadow-md"
                    onClick={() => startOAuth("42")}
                  >
                    <span className="flex size-5 items-center justify-center rounded-md bg-[#00babc] text-[10px] font-bold tracking-tight text-white shadow-sm shadow-[#00babc]/40">
                      42
                    </span>
                    Continue with 42 Intra
                  </Button>
                </div>
                <FieldDescription className="px-6 text-center">
                  Already have an account?{" "}
                  <Link to={"/login"} className="underline underline-offset-4">
                    Sign in
                  </Link>
                </FieldDescription>
              </Field>
            </FieldGroup>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  );
}
