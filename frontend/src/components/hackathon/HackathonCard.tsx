import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { HackathonCardProps } from "@/types/hackathon";
import { Link } from "react-router-dom";

// This component displays a hackathon's title, organization, description, and dates.
// It uses a hover overlay to invite users to see more details.
// TODO: Add a picture to each hackathon card.
export function HackathonCard({ hackathon }: HackathonCardProps) {
  return (
    <Card className="flex w-full max-w-sm flex-col transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
      <CardHeader>
        <CardTitle className="break-words">{hackathon.title}</CardTitle>
      </CardHeader>

      <CardContent className="mt-auto pt-4">
        <Link
          to={`/hackathons/${hackathon.id}`}
          className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          View Details
        </Link>
      </CardContent>
    </Card>
  );
}
