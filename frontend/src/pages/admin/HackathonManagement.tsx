import HackathonTable from "@/components/admin/HackathonTable";
import { Plus } from "lucide-react";
import type { Hackathon } from "@/types/hackathon";

const hackathons: Hackathon[] = [
  {
    id: 1,
    title: "AI Innovation Challenge",
    organization_name: "Tech Community",
    description: null,
    start_at: "2026-10-20T09:00:00Z",
    end_at: "2026-10-25T18:00:00Z",
  },
  {
    id: 2,
    title: "Open Source Sprint",
    organization_name: "DevHub",
    description: null,
    start_at: "2026-11-02T09:00:00Z",
    end_at: "2026-11-05T18:00:00Z",
  },
];

function HackathonManagement() {
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

        <button
          type="button"
          className="inline-flex w-fit shrink-0 items-center justify-center gap-2 rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-gray-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900"
        >
          <Plus size={18} />
          Create Hackathon
        </button>
      </div>
      <HackathonTable hackathons={ hackathons }/>
    </section>
  );
}

export default HackathonManagement;
