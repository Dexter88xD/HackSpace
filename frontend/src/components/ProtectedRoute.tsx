import React from "react";
import { Navigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getMe } from "@/api/auth";
import { Spinner } from "./ui/spinner";

type ProtectedRouteProps = {
    children: React.ReactNode;
};

// Protects authenticated routes by validating the user's HttpOnly authentication
// cookie through /auth/me, displaying a loading spinner while authentication is
// being checked, and redirecting unauthenticated users to the login page.
export default function ProtectedRoute({children} : ProtectedRouteProps) {
    const meQuery = useQuery({
    queryKey: ['me'],
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

  return children;
}