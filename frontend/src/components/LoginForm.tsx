import * as React from "react";

import { cn } from "cn";

import { Button } from "@/components/ui/button";
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
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { OAuthButtons } from "@/components/OAuthButtons";
import { useForm } from "react-hook-form";
import { LoginFormData, loginSchema } from "@/schemas/login.schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getMe, login } from "@/api/auth";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { FieldError } from "@/components/ui/field";
import { Alert, AlertDescription } from "@/components/ui/alert";
import axios from "axios";

// Handles login using React Hook Form, Zod and TanStack Query.
// After successful cookie-based authentication, clears cached session data,
// fetches the current user, updates ["me"] and redirects to Home.
// Handles login errors, session verification failures and unverified emails.
export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const oauthError = searchParams.get("oauthError");
  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });
  const [sessionError, setSessionError] = React.useState<string | null>(null);
  const loginMutation = useMutation({
    mutationFn: login,
    onSuccess: async () => {
      queryClient.clear();

      try {
        const user = await getMe();

        queryClient.setQueryData(["me"], user);
        navigate("/");
      } catch {
        setSessionError(
          "You signed in, but we couldn't verify your session. Please try refreshing the page.",
        );
      }
    },
    onError: (error) => {
      if (axios.isAxiosError(error)) {
        if (error.response?.data.code === "EMAIL_NOT_VERIFIED") {
          sessionStorage.setItem(
            "verificationEmail",
            error.response.data.email,
          );
          navigate("/verify-otp");
        }
      }
    },
  });
  const onSubmit = (data: LoginFormData) => {
    setSessionError(null);
    loginMutation.mutate(data);
  };
  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Welcome back</CardTitle>
          <CardDescription>
            Login with your Google or 42 account
          </CardDescription>
        </CardHeader>
        <CardContent>
          {oauthError && (
            <Alert variant="destructive" className="mb-6">
              <AlertDescription>{oauthError}</AlertDescription>
            </Alert>
          )}
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <FieldGroup>
              <Field>
                <OAuthButtons />
              </Field>
              <FieldSeparator className="*:data-[slot=field-separator-content]:bg-card">
                Or continue with
              </FieldSeparator>
              <Field>
                <FieldLabel htmlFor="identifier">Username or email</FieldLabel>
                <Input
                  id="identifier"
                  type="text"
                  placeholder="username or email"
                  {...form.register("identifier")}
                />
              </Field>
              <Field>
                <div className="flex items-center">
                  <FieldLabel htmlFor="password">Password</FieldLabel>
                  <a
                    href="#"
                    className="ml-auto text-sm underline-offset-4 hover:underline"
                  >
                    Forgot your password?
                  </a>
                </div>
                <Input
                  id="password"
                  type="password"
                  {...form.register("password")}
                />
              </Field>
              <Field>
                <Button type="submit" disabled={loginMutation.isPending}>
                  {loginMutation.isPending && (
                    <Loader2 className="animate-spin" />
                  )}
                  {loginMutation.isPending ? "Logging in..." : "Login"}
                </Button>
                {loginMutation.isError && (
                  <FieldError>
                    {axios.isAxiosError(loginMutation.error)
                      ? (loginMutation.error.response?.data?.message ??
                        "Something went wrong")
                      : "Something went wrong"}
                  </FieldError>
                )}
                {sessionError && <FieldError>{sessionError}</FieldError>}
                <FieldDescription className="text-center">
                  Don&apos;t have an account?{" "}
                  <Link
                    to={"/register"}
                    className="underline underline-offset-4"
                  >
                    Sign up
                  </Link>
                </FieldDescription>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
      {/* TODO: Add links to the Terms of Service and Privacy Policy. */}
      <FieldDescription className="px-6 text-center">
        By clicking continue, you agree to our <a href="#">Terms of Service</a>{" "}
        and <a href="#">Privacy Policy</a>.
      </FieldDescription>
    </div>
  );
}
