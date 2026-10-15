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
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => startOAuth('google')}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                    <path
                      d="M21.35 12.27c0-.78-.07-1.54-.2-2.27H12v4.3h5.22a4.47 4.47 0 0 1-1.94 2.93v2.43h3.14c1.84-1.69 2.93-4.18 2.93-7.39Z"
                      fill="currentColor"
                    />
                  </svg>
                  Login with Google
                </Button>
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => startOAuth('42')}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                    <text x="12" y="16" textAnchor="middle" fontSize="11" fontWeight="700" fill="currentColor">42</text>
                  </svg>
                  Login with 42 Intra
                </Button>
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
