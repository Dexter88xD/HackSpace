import HackathonFilters from "@/components/hackathon/HackathonFilters";
import { getHackathons } from "@/api/hackathon";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { HackathonFiltersType } from "@/types/hackathon";
import { LoaderCircle } from "lucide-react";
import { HackathonCard } from "@/components/hackathon/HackathonCard";
import { HackathonPagination } from "@/components/hackathon/HackathonPagination";
import axios from "axios";

// This component displays hackathons and manages filter and pagination state.
// TanStack Query fetches hackathons whenever the filters change.
// It handles loading, error, empty, and successful results states.
function HackathonExplorer() {
  const [filters, setFilters] = useState<HackathonFiltersType>({
    page: 1,
    limit: 12,
  });
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["hackathons", filters],
    queryFn: () => getHackathons(filters),
  });

  return (
    <div className="flex min-h-screen flex-col gap-6">
      <h1 className="text-2xl font-bold sm:text-5xl md:text-7xl mb-6 font-serif text-center">
        Hackathon Explorer
      </h1>
      <HackathonFilters setFilters={setFilters} />
      <div className="flex flex-1 flex-col">
        {isLoading ? (
          <div className="flex flex-1 items-center justify-center">
            <LoaderCircle className="h-8 w-8 animate-spin" />
          </div>
        ) : isError ? (
          <div className="flex flex-1 items-center justify-center">
            <p>
              Failed to load hackathons:{" "}
              {axios.isAxiosError(error)
                ? (error.response?.data?.message ?? error.message)
                : error.message}
            </p>
          </div>
        ) : data?.data.length === 0 ? (
          <div className="flex flex-1 items-center justify-center">
            <p>No hackathons found.</p>
          </div>
        ) : (
          <div className="flex flex-1 flex-col justify-between gap-10">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 justify-items-center">
              {data?.data.map((hackathon) => (
                <HackathonCard key={hackathon.id} hackathon={hackathon} />
              ))}
            </div>
            <HackathonPagination
              currentPage={filters.page ?? 1}
              totalPages={Math.ceil((data?.total ?? 0) / (data?.limit ?? 12))}
              onPageChange={(page) => {
                setFilters((prev) => ({
                  ...prev,
                  page,
                }));
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default HackathonExplorer;
