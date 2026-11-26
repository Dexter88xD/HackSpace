import { isAxiosError } from "axios";
import { useQuery } from "@tanstack/react-query";
import { getMe } from "@/api/auth";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import LandingPage from "./LandingPage";
import AuthenticatedHome from "./AuthenticatedHome";

export default function Home() {
  const meQuery = useQuery({
    queryKey: ["me"],
    queryFn: getMe,
    retry: false,
  });

  if (meQuery.isPending) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center gap-3">
        <Spinner />
        <p role="status">Checking your session...</p>
      </div>
    );
  }

  if (meQuery.isError) {
    if (isAxiosError(meQuery.error) && meQuery.error.response?.status === 401) {
      return <LandingPage />;
    }

    return (
      <section className="mx-auto max-w-lg space-y-4 px-4 py-20 text-center">
        <h1 className="text-2xl font-semibold">Unable to check your session</h1>
        <p role="alert" className="text-muted-foreground">
          We couldn't connect to HackSpace. Please try again.
        </p>
        <Button disabled={meQuery.isFetching} onClick={() => void meQuery.refetch()}>
          {meQuery.isFetching ? "Retrying..." : "Try again"}
        </Button>
      </section>
    );
  }

  return <AuthenticatedHome user={meQuery.data} />;
}
