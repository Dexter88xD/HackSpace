import * as React from "react"

import { cn } from "cn"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { useForm } from "react-hook-form"
import { LoginFormData, loginSchema } from "@/schemas/login.schema"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation } from "@tanstack/react-query"
import { login, startOAuth } from "@/api/auth"
import { Link, useNavigate, useSearchParams } from "react-router-dom"
import { Loader2 } from "lucide-react"
import { FieldError } from "@/components/ui/field"
import { Alert, AlertDescription } from "@/components/ui/alert"
import axios from "axios"

// Login form component that validates user credentials with React Hook Form and Zod,
// submits the login request through TanStack Query, displays loading and API error states,
// stores the returned access token on successful authentication and redirects to the home page.
// If the backend reports that the user's email is not verified, it stores the login email in
// sessionStorage and redirects the user to the OTP verification page. The form also provides
// placeholders for Intra/Google authentication, a forgot-password link, and navigation
// to the registration page.
export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const oauthError = searchParams.get('oauthError');
  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema)
  })
  const loginMutation = useMutation({
    mutationFn: login,
    onSuccess: () => {
      navigate('/');
    },
    onError: (error) => {
      if(axios.isAxiosError(error)) {
        if(error.response?.data.code === 'EMAIL_NOT_VERIFIED') {
          sessionStorage.setItem('verificationEmail', error.response.data.email);
          navigate('/verify-otp')
        } 
      }
    }
  })
  const onSubmit = (data: LoginFormData) => {
    loginMutation.mutate(data)
  }
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
                <div className="space-y-2">
                <Button
                  variant="outline"
                  type="button"
                  aria-label="Login with Google"
                  title="Login with Google"
                  className="h-10 w-full justify-start border-border border-l-4 border-l-[#4285f4] bg-card px-3 text-foreground transition-all hover:-translate-y-0.5 hover:bg-[#4285f4]/5 hover:shadow-md"
                  onClick={() => startOAuth('google')}
                >
                  <svg aria-hidden="true" viewBox="0 0 24 24" className="size-4">
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
                  aria-label="Login with 42 Intra"
                  title="Login with 42 Intra"
                  className="h-10 w-full justify-start border-border border-l-4 border-l-[#00babc] bg-card px-3 text-foreground transition-all hover:-translate-y-0.5 hover:bg-[#00babc]/5 hover:shadow-md"
                  onClick={() => startOAuth('42')}
                >
                  <span className="flex size-5 items-center justify-center rounded-md bg-[#00babc] text-[10px] font-bold tracking-tight text-white">
                    42
                  </span>
                  Continue with 42 Intra
                </Button>
                </div>
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
                  {...form.register('identifier')}
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
                <Input id="password" type="password" {...form.register('password')} />
              </Field>
              <Field>
                  <Button type="submit" disabled={loginMutation.isPending}>
                  {loginMutation.isPending && (
                    <Loader2 className="animate-spin" />
                  )}
                  {loginMutation.isPending
                    ? "Logging in..."
                    : "Login"}
                </Button>
              {loginMutation.isError && (
              <FieldError>
                {axios.isAxiosError(loginMutation.error)
                  ? loginMutation.error.response?.data?.message
                  : "Something went wrong"}
              </FieldError>
            )}
                <FieldDescription className="text-center">
                  Don&apos;t have an account? <Link to={'/register'} className="underline underline-offset-4">Sign up</Link> 
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
  )
}
