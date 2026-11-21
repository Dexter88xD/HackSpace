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

      {hackathons.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 px-4 py-12 text-center">
          <CalendarX size={40} className="text-muted-foreground" />

          <p className="text-base font-semibold text-foreground">
            No hackathons found
          </p>

          <p className="text-sm text-muted-foreground">
            Hackathons you organise will appear here.
          </p>
        </div>
      ) : (
        <>
          {/* Mobile and tablet: responsive card layout */}
          <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 lg:hidden">
            {hackathons.map((hackathon) => (
              <article
                key={hackathon.id}
                className="flex min-w-0 flex-col gap-3 rounded-lg border border-border p-4"
              >
                <h3 className="break-words text-sm font-semibold text-foreground">
                  {hackathon.title}
                </h3>

                <dl className="space-y-2 text-sm">
                  <div className="flex flex-wrap justify-between gap-x-3 gap-y-1">
                    <dt className="text-muted-foreground">Organisation</dt>
                    <dd className="min-w-0 break-words text-right">
                      {hackathon.organizationName}
                    </dd>
                  </div>

                  <div className="flex justify-between gap-3">
                    <dt className="text-muted-foreground">Starts</dt>
                    <dd>
                      {new Date(hackathon.startAt).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </dd>
                  </div>

                  <div className="flex justify-between gap-3">
                    <dt className="text-muted-foreground">Ends</dt>
                    <dd>
                      {new Date(hackathon.endAt).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </dd>
                  </div>
                </dl>

                <Link
                  to={`/hackathons/${hackathon.id}/edit`}
                  state={{ returnTo: "/hackathons" }}
                  className={buttonVariants({
                    variant: "outline",
                    size: "sm",
                    className: "mt-auto w-full",
                  })}
                  aria-label={`Edit ${hackathon.title}`}
                >
                  Edit
                </Link>
              </article>
            ))}
          </div>
          {/* Desktop: full management table */}
          <div className="hidden overflow-x-auto lg:block">
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
                {hackathons.map((hackathon) => (
                  <tr
                    key={hackathon.id}
                    className="transition-colors hover:bg-muted/50"
                  >
                    <td className="px-6 py-4 font-medium text-foreground">
                      {hackathon.title}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {hackathon.organizationName}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {new Date(hackathon.startAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {new Date(hackathon.endAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-6 py-4">
                      <Link
                        to={`/hackathons/${hackathon.id}/edit`}
                        state={{ returnTo: "/hackathons" }}
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
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

export default HackathonTable;
