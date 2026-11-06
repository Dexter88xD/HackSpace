import HackathonTable from "@/components/hackathon/HackathonTable";
import { useQuery } from "@tanstack/react-query";
import { getHackathons, getMyHackathons } from "@/api/hackathon";
import { Plus } from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";
import { HackathonPagination } from "@/components/hackathon/HackathonPagination";
import { getMe } from "@/api/auth";
import { buttonVariants } from "@/components/ui/button";

function HackathonManagement() {
  const [page, setPage] = useState(1);
  const limit = 12;

  const { data: currentUser } = useQuery({
    queryKey: ["me"],
    queryFn: getMe,
  });

  const userRole = currentUser?.role;
  const { data, isPending, isError } = useQuery({
    queryKey: ["management-hackathons", userRole, { page, limit }],
    queryFn: () =>
      userRole === "ROLE_ADMIN"
        ? getHackathons({ page, limit })
        : getMyHackathons({ page, limit }),
    enabled: !!userRole,
  });
  return (
    <section className="mx-auto w-full max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Hackathon Management
          </h1>
          <p className="mt-2 text-sm text-muted-foreground sm:text-base">
            {userRole === "ROLE_ADMIN"
              ? "Create and manage all hackathons across the platform."
              : "Create and manage hackathons you organize."}
          </p>
        </div>

        <Link
          to="/hackathons/new"
          state={{ returnTo: "/hackathons" }}
          className={buttonVariants({ variant: "default", size: "lg" })}
        >
          <Plus size={18} />
          Create Hackathon
        </Link>
      </div>
      {isPending ? (
        <p>Loading hackathons...</p>
      ) : isError ? (
        <p role="alert">Failed to load hackathons.</p>
      ) : (
        <HackathonTable
          hackathons={data?.data ?? []}
          total={data?.total ?? 0}
        />
      )}
      {data && data.total > limit && (
        <HackathonPagination
          currentPage={page}
          totalPages={Math.ceil(data.total / limit)}
          onPageChange={setPage}
        />
      )}
    </section>
  );
}

export default HackathonManagement;
