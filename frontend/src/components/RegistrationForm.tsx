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
import { OAuthButtons } from "@/components/OAuthButtons";
import { useMutation } from "@tanstack/react-query";
import { register } from "@/api/auth";
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
                <OAuthButtons />
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
