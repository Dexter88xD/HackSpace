const sections = [
  {
    title: "1. About HackSpace",
    body: [
      "HackSpace is a platform for organising and taking part in hackathons, built as the ft_transcendence student project of the 42 curriculum. By creating an account or using HackSpace, you agree to these terms. If you do not agree, please do not use the platform.",
    ],
  },
  {
    title: "2. Your account",
    body: [
      "You must give a valid email address and keep your password secret. You are responsible for everything done with your account.",
      "One person may have only one account. Do not create accounts for other people or pretend to be someone else.",
    ],
  },
  {
    title: "3. Hackathons, teams and submissions",
    body: [
      "Any signed-in user can create a hackathon and becomes its organiser. Organisers are responsible for the rules, dates and settings of their hackathon, and must run it fairly.",
      "Participants must register during the registration phase and follow the hackathon's rules, including team size limits and submission deadlines.",
      "Your team owns the work it submits. By submitting, you allow the organisers and judges of that hackathon to view and evaluate it. Judges must score submissions honestly and only for hackathons they were assigned to.",
    ],
  },
  {
    title: "4. Acceptable use",
    body: [
      "Be respectful in chats, profiles and team names. Harassment, hate speech, spam and sexual or violent content are not allowed.",
      "Only upload files you have the right to share. Do not upload malware or content that breaks the law.",
      "Do not try to access other users' accounts or data, get around permission checks, or disrupt the platform, for example by flooding it with requests.",
    ],
  },
  {
    title: "5. Moderation",
    body: [
      "Platform administrators may edit or remove content and suspend or delete accounts that break these terms.",
    ],
  },
  {
    title: "6. Availability and liability",
    body: [
      "HackSpace is a student project provided as is, without any guarantee. It may be unavailable, change or be shut down at any time, and data may be lost. Keep your own copy of anything important, such as your submissions.",
      "The HackSpace team is not responsible for the content users post, for how organisers run their hackathons, or for any prizes they offer.",
    ],
  },
  {
    title: "7. Privacy",
    body: [
      "How we handle your data is explained in our Privacy Policy, which is part of these terms.",
    ],
  },
  {
    title: "8. Changes and contact",
    body: [
      "We may update these terms. When we do, we will change the date below. For questions, contact the HackSpace team through the 42 intranet: hqannouc, aait-our, sel-maaq, aedarkao or sohamdan.",
    ],
  },
];

function TermsOfService() {
  return (
    <div className="mx-auto max-w-3xl p-6">
      <h1 className="mb-2 text-3xl font-bold">Terms of Service</h1>
      <p className="mb-8 text-sm text-muted-foreground">
        Last updated: 23 November 2026
      </p>

      <div className="space-y-8">
        {sections.map((section) => (
          <section key={section.title} className="space-y-3">
            <h2 className="text-xl font-semibold">{section.title}</h2>
            {section.body.map((paragraph) => (
              <p key={paragraph} className="leading-7 text-muted-foreground">
                {paragraph}
              </p>
            ))}
          </section>
        ))}
      </div>
    </div>
  );
}

export default TermsOfService;
