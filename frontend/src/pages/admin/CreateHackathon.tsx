import HackathonForm from "@/components/admin/HackathonForm";

function CreateHackathon() {
  return (
    <section className="mx-auto w-full max-w-3xl px-4 py-8">
      <h1 className="mb-6 text-3xl font-bold">Create Hackathon</h1>
      <HackathonForm />
    </section>
  );
}

export default CreateHackathon;
