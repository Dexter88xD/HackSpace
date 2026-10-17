import HackathonTable from "@/components/admin/HackathonTable";
import { useQuery } from "@tanstack/react-query";
import { getHackathons } from "@/api/hackathon";
import { Plus } from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";
import { HackathonPagination } from "@/components/hackathon/HackathonPagination";

function HackathonManagement() {
  const [page, setPage] = useState(1);
  const limit = 12;

  const { data, isPending, isError } = useQuery({
    queryKey: ["hackathons", { page, limit }],
    queryFn: () => getHackathons({ page, limit }),
  });
  return (
    <section className="mx-auto w-full max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Hackathon Management
          </h1>
          <p className="mt-2 text-sm text-gray-600 sm:text-base">
            Create and manage hackathons across the platform.
          </p>
        </div>

        <Link
          to="/admin/hackathons/new"
          className="inline-flex w-fit items-center gap-2 rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-700"
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
        <HackathonTable hackathons={data.data} />
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
