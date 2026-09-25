import React from "react";
import { Navigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getMe } from "@/api/auth";
import { Spinner } from "./ui/spinner";

type ProtectedRouteProps = {
    children: React.ReactNode;
}
// Protects authenticated routes by checking for an access token, validating it through the /me query,
// displaying a loading spinner while the user is being verified, and redirecting to login when the token
// is missing or invalid. Once authentication is confirmed, the protected content is rendered.
export default function ProtectedRoute({children} : ProtectedRouteProps) {
    const accessToken = localStorage.getItem('accessToken');
    const meQuery = useQuery({
    queryKey: ['me'],
    queryFn: getMe,
    enabled: !!accessToken,
    retry: false,
  });

  if (!accessToken) {
    return <Navigate to="/login" replace />;
  }
  if (meQuery.isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (meQuery.isError) {
    localStorage.removeItem('accessToken');
    return <Navigate to="/login" replace />;
  }
    if(!accessToken)
        return <Navigate to="login" replace/>
    return children;
}