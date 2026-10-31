import { useParams } from "react-router-dom";

export default function HackathonDetails() {
  const { id } = useParams<{ id: string }>();

  return (
    <section>
      <h1>Hackathon Details</h1>
      <p>Hackathon ID: {id}</p>
    </section>
  );
}
