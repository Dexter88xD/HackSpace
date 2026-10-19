import type { HackathonTableProps } from "@/types/hackathon-management";
import { CalendarX } from "lucide-react";
import { Link } from "react-router-dom";

function HackathonTable({ hackathons, total }: HackathonTableProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
        <h2 className="text-lg font-semibold text-gray-900">All Hackathons</h2>
        <span className="text-sm text-gray-500">{total} events</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[750px] text-left text-sm">
          <thead className="bg-gray-50 text-xs font-semibold uppercase tracking-wide text-gray-500">
            <tr>
              <th scope="col" className="px-6 py-4">
                Hackathon
              </th>
              <th scope="col" className="px-6 py-4">
                Organization
              </th>
              <th scope="col" className="px-6 py-4">
                Start Date
              </th>
              <th scope="col" className="px-6 py-4">
                End Date
              </th>
              <th scope="col" className="px-6 py-4">
                Actions
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100">
            {hackathons.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12">
                  <div className="flex flex-col items-center justify-center gap-2 text-center">
                    <CalendarX size={40} className="text-gray-500" />
                    <p className="text-base font-semibold text-gray-900">
                      No hackathons found
                    </p>
                    <p className="text-sm text-gray-500">
                      Created hackathons will appear here.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              hackathons.map((hackathon) => (
                <tr
                  key={hackathon.id}
                  className="transition-colors hover:bg-gray-50"
                >
                  <td className="px-6 py-4 font-medium text-gray-900">
                    {hackathon.title}
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    {hackathon.organization_name}
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    {new Date(hackathon.start_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    {new Date(hackathon.end_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </td>
                  <td className="px-6 py-4">
                    <Link
                      to={`/admin/hackathons/${hackathon.id}/edit`}
                      className="font-medium text-gray-900 hover:underline"
                    >
                      Edit
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default HackathonTable;
