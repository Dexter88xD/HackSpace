import React from "react";
import { Navigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getMe } from "@/api/auth";
import { Spinner } from "./ui/spinner";
import type { UserRole } from "@/types/auth";

type ProtectedRouteProps = {
  children: React.ReactNode;
  requiredRole?: UserRole;
};

// Protects authenticated routes by validating the user's HttpOnly authentication
// cookie through /auth/me, displaying a loading spinner while authentication is
// being checked, and redirecting unauthenticated users to the login page.
export default function ProtectedRoute(
  { children, requiredRole }: ProtectedRouteProps,
) {
  const meQuery = useQuery({
    queryKey: ["me"],
    queryFn: getMe,
    retry: false,
  });

  if (meQuery.isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (meQuery.isError) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && meQuery.data.role !== requiredRole) {
    return <Navigate to="/" replace />;
  }

  return children;
}
