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
    <Card {...props}>
      <CardHeader>
        <CardTitle>Create an account</CardTitle>
        <CardDescription>
          Enter your information below to create your account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit((data) => onSubmit(data))}>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="name">Full Name</FieldLabel>
              <Input
                id="name"
                type="text"
                placeholder="Full Name"
                {...form.register("fullName")}
              />
            </Field>
            {form.formState.errors.fullName && (
              <FieldError>{form.formState.errors.fullName.message}</FieldError>
            )}
            <Field>
              <FieldLabel htmlFor="name">Username</FieldLabel>
              <Input
                id="name"
                type="text"
                placeholder="Username"
                {...form.register("username")}
              />
            </Field>
            {form.formState.errors.username && (
              <FieldError>{form.formState.errors.username.message}</FieldError>
            )}
            <Field>
              <FieldLabel htmlFor="email">Email</FieldLabel>
              <Input
                id="email"
                type="email"
                placeholder="Email"
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
                {...form.register("confirmPassword")}
              />
              <FieldDescription>Please confirm your password.</FieldDescription>
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
                <Button type="submit" disabled={registerMutation.isPending}>
                  {registerMutation.isPending && (
                    <Loader2 className="animate-spin" />
                  )}
                  {registerMutation.isPending
                    ? "Creating..."
                    : "Create Account"}
                </Button>
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => startOAuth("google")}
                >
                  Sign up with Google
                </Button>
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => startOAuth("42")}
                >
                  Sign up with 42 Intra
                </Button>
                <FieldDescription className="px-6 text-center">
                  Already have an account? <Link to={'/login'} className="underline underline-offset-4">Sign in</Link>
                </FieldDescription>
              </Field>
            </FieldGroup>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  );
}
