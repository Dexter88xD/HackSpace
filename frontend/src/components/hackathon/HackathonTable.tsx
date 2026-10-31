import type { HackathonTableProps } from "@/types/hackathon-management";
import { CalendarX } from "lucide-react";
import { Link } from "react-router-dom";
import { buttonVariants } from "@/components/ui/button";

function HackathonTable({ hackathons, total }: HackathonTableProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      <div className="flex items-center justify-between border-b border-border px-6 py-4">
        <h2 className="text-lg font-semibold text-foreground">My Hackathons</h2>
        <span className="text-sm text-muted-foreground">{total} events</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[750px] text-left text-sm">
          <thead className="bg-muted/50 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
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

          <tbody className="divide-y divide-border">
            {hackathons.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12">
                  <div className="flex flex-col items-center justify-center gap-2 text-center">
                    <CalendarX size={40} className="text-muted-foreground" />
                    <p className="text-base font-semibold text-foreground">
                      No hackathons found
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Hackathons you organize will appear here.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              hackathons.map((hackathon) => (
                <tr
                  key={hackathon.id}
                  className="transition-colors hover:bg-muted/50"
                >
                  <td className="px-6 py-4 font-medium text-foreground">
                    {hackathon.title}
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">
                    {hackathon.organization_name}
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">
                    {new Date(hackathon.start_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">
                    {new Date(hackathon.end_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </td>
                  <td className="px-6 py-4">
                    <Link
                      to={`/hackathons/${hackathon.id}/edit`}
                      className={buttonVariants({
                        variant: "outline",
                        size: "sm",
                      })}
                      aria-label={`Edit ${hackathon.title}`}
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
