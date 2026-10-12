import { useParams } from "react-router-dom";
import HackathonForm from "@/components/admin/HackathonForm";
import { Hackathon } from "@/types/hackathon";

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

function EditHackathon() {
  const { id } = useParams();

  const hackathon = hackathons.find(
    (hackathon) => hackathon.id === Number(id),
  );

  if (!hackathon) {
    return <p>Hackathon not found.</p>;
  }

  return (
    <section className="mx-auto w-full max-w-3xl px-4 py-8">
      <h1 className="mb-6 text-3xl font-bold">Edit Hackathon</h1>
      <HackathonForm hackathon={hackathon} />
    </section>
  );
}

export default EditHackathon;