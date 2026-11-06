import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { Building2, CalendarDays } from "lucide-react";
import type { HackathonCardProps } from "@/types/hackathon";

// This component displays a hackathon's title, organization, description, and dates.
// TODO: Add a picture to each hackathon card.
export function HackathonCard({ hackathon }: HackathonCardProps) {
  const startDate = new Date(hackathon.start_at);
  const endDate = new Date(hackathon.end_at);

  const dateFormatter = new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const dateRange = `${dateFormatter.format(startDate)} – ${dateFormatter.format(endDate)}`;

  return (
    <Card className="flex w-full max-w-sm flex-col transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
      <CardHeader>
        <CardTitle className="line-clamp-2 break-words">
          {hackathon.title}
        </CardTitle>

        <div className="flex items-start gap-2 text-sm text-muted-foreground">
          <Building2 className="mt-0.5 size-4 shrink-0" />
          <span className="line-clamp-1 break-words">
            {hackathon.organization_name}
          </span>
        </div>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col gap-4">
        <div className="flex items-start gap-2 text-sm text-muted-foreground">
          <CalendarDays className="mt-0.5 size-4 shrink-0" />

          <span>{dateRange}</span>
        </div>

        <div className="mt-auto pt-2">
          <Link
            to={`/hackathons/${hackathon.id}`}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            View Details
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
