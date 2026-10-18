import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import type { HackathonCardProps } from "@/types/hackathon";

// This component displays a hackathon's title, organization, description, and dates.
// It uses a hover overlay to invite users to see more details.
// TODO: Add a picture to each hackathon card.
export function HackathonCard({ hackathon }: HackathonCardProps) {
  return (
    <Card className="relative w-full max-w-sm cursor-pointer overflow-hidden transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-xl">
      <CardHeader>
        <CardTitle>{hackathon.title}</CardTitle>
        <CardDescription className="line-clamp-3">
          Organized by {hackathon.organization_name}
        </CardDescription>
      </CardHeader>

      <CardContent>
        <p className="line-clamp-3 break-words">{hackathon.description}</p>

        <div className="mt-4 text-sm text-muted-foreground">
          <p>
            Starts:{" "}
            {new Date(hackathon.start_at).toLocaleString("en-GB", {
              day: "2-digit",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
              hour12: false,
            })}
          </p>
          <p>
            Ends:{" "}
            {new Date(hackathon.end_at).toLocaleString("en-GB", {
              day: "2-digit",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
              hour12: false,
            })}
          </p>
        </div>
      </CardContent>

      <div className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 transition-opacity duration-300 hover:opacity-100">
        <span className="rounded-md border border-white/70 px-5 py-2 font-medium text-white transition-transform duration-300 hover:scale-105">
          See more →
        </span>
      </div>
    </Card>
  );
}
