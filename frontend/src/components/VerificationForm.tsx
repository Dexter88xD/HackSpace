import { CheckIcon, Loader2Icon, RefreshCwIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Controller, useForm } from "react-hook-form";
import {
  VerificationFormData,
  verificationSchema,
} from "@/schemas/verification.schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { resend, verify } from "@/api/auth";
import { Loader2 } from "lucide-react";
import axios from "axios";
import { CheckCircle2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

// Email verification form that retrieves the user's verification email from sessionStorage,
// validates and submits the OTP through TanStack Query, displays verification and resend states,
// shows success or error feedback, allows the user to request a new verification code, and redirects
// to the login page after successful email verification.
export function VerificatioForm() {
  const navigate = useNavigate();
  const email = sessionStorage.getItem("verificationEmail")!;
  const form = useForm<VerificationFormData>({
    resolver: zodResolver(verificationSchema),
    defaultValues: {
      email,
      otp: "",
    },
  });
  const verifyMutation = useMutation({
    mutationFn: verify,
    onSuccess: () => {
      setTimeout(() => {
        navigate("/login");
      }, 3000);
    },
  });

  const onSubmit = (data: VerificationFormData) => {
    verifyMutation.mutate(data);
  };
  const [resendSuccess, setResendSuccess] = useState(false);
  const resendMutation = useMutation({
    mutationFn: resend,
    onSuccess: () => {
      setResendSuccess(true);
      setTimeout(() => {
        setResendSuccess(false);
      }, 2000);
    },
  });
  if (verifyMutation.isSuccess) {
    return (
      <Alert>
        <CheckCircle2 />
        <AlertTitle>Email verified!</AlertTitle>
        <AlertDescription>
          Your email has been successfully verified.
          <br />
          Redirecting to login...
        </AlertDescription>
      </Alert>
    );
  }
  return (
    <Card className="mx-auto max-w-md">
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <CardHeader>
          <CardTitle>Verify your login</CardTitle>
          <CardDescription>
            Enter the verification code we sent to your email address:{" "}
            <span className="font-medium">{email}</span>.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Field>
            <div className="flex items-center justify-between">
              <FieldLabel htmlFor="otp-verification">
                Verification code
              </FieldLabel>
              <Button
                variant="outline"
                size="xs"
                onClick={() => resendMutation.mutate(sessionStorage.getItem('verificationEmail')!)}
                disabled={resendMutation.isPending || resendSuccess}
              >
                {resendMutation.isPending ? (
                  <>
                    <Loader2Icon className="animate-spin" />
                    Sending...
                  </>
                ) : resendSuccess ? (
                  <>
                    <CheckIcon />
                    Sent!
                  </>
                ) : (
                  <>
                    <RefreshCwIcon />
                    Resend Code
                  </>
                )}
              </Button>
            </div>
            <Controller
              name="otp"
              control={form.control}
              render={({ field }) => (
                <InputOTP
                  maxLength={6}
                  id="otp-verification"
                  value={field.value}
                  onChange={field.onChange}
                >
                  <InputOTPGroup className="*:data-[slot=input-otp-slot]:h-12 *:data-[slot=input-otp-slot]:w-11 *:data-[slot=input-otp-slot]:text-xl">
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                  </InputOTPGroup>
                  <InputOTPSeparator className="mx-2" />
                  <InputOTPGroup className="*:data-[slot=input-otp-slot]:h-12 *:data-[slot=input-otp-slot]:w-11 *:data-[slot=input-otp-slot]:text-xl">
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
              )}
            />
            {form.formState.errors.otp && (
              <FieldError>{form.formState.errors.otp.message}</FieldError>
            )}
            {verifyMutation.isError && (
              <FieldError>
                {axios.isAxiosError(verifyMutation.error)
                  ? verifyMutation.error.response?.data?.message
                  : "Something went wrong"}
              </FieldError>
            )}
          </Field>
        </CardContent>
        <br />
        <CardFooter>
          <Field>
            <Button type="submit" className="w-full">
              {verifyMutation.isPending && <Loader2 className="animate-spin" />}
              {verifyMutation.isPending ? "Verifying..." : "Verify"}
            </Button>
            <div className="text-sm text-muted-foreground">
              Having trouble signing in?{" "}
              <a
                href="#"
                className="underline underline-offset-4 transition-colors hover:text-primary"
              >
                Contact support
              </a>
            </div>
          </Field>
        </CardFooter>
      </form>
    </Card>
  );
}
