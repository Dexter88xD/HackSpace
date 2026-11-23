const sections = [
  {
    title: "1. Who we are",
    body: [
      "HackSpace is a platform for organising and taking part in hackathons, built by a team of five students as the ft_transcendence project of the 42 curriculum. It is a student project, not a commercial service. This policy explains what data HackSpace stores about you, why, and what you can do about it.",
    ],
  },
  {
    title: "2. Data we collect",
    body: [
      "Account data: your username, full name, email address and a hashed version of your password. We never store your password in plain text.",
      "Sign-in with Google or 42: if you use one of these providers, we store the provider name and your account ID with that provider so we can link it to your HackSpace account. We do not receive or store your Google or 42 password.",
      "Profile data: anything you add to your profile, such as your bio, organisation, field of study, skills and avatar image.",
      "Activity data: the hackathons you organise or register for, your teams and join requests, your friends and friend requests, the messages you send in team chats, and the files your team submits.",
      "Verification codes: when you sign up we email you a one-time code. We store only a hashed copy of it, and it expires after 10 minutes.",
    ],
  },
  {
    title: "3. How we use your data",
    body: [
      "We use your data only to run HackSpace: to sign you in, show your profile, let you join hackathons and teams, deliver chat messages, store submissions and let organisers and judges evaluate them.",
      "We do not sell your data, show advertising, or use analytics or tracking tools.",
    ],
  },
  {
    title: "4. Who can see your data",
    body: [
      "Other signed-in users can see your public profile: username, full name, bio, organisation, field of study and avatar. Your email address and password hash are never shown to other users.",
      "Your team members can read your team chat messages and see your team's submissions. Organisers and judges of a hackathon can see the teams and submissions for that hackathon.",
      "Platform administrators can access data when needed to run and moderate the platform.",
    ],
  },
  {
    title: "5. Cookies",
    body: [
      "HackSpace uses one sign-in cookie, accessToken, which keeps you logged in for up to 7 days. It is HTTP-only, so scripts in the page cannot read it. During Google or 42 sign-in we also set a short-lived cookie (10 minutes) to protect the sign-in against forgery.",
      "We do not use advertising or third-party tracking cookies.",
    ],
  },
  {
    title: "6. Where your data is stored",
    body: [
      "Your data is stored in a PostgreSQL database and your files (avatars and submissions) in MinIO object storage, both running on the HackSpace servers. Files are kept private and are only shared through short-lived links (one hour) after a permission check. All connections to HackSpace use HTTPS.",
    ],
  },
  {
    title: "7. How long we keep your data",
    body: [
      "We keep your data while your account exists. When you replace or remove your avatar, the old image is deleted. When the project ends, the database and files are deleted.",
    ],
  },
  {
    title: "8. Your rights",
    body: [
      "You can view and update your profile at any time from your profile page, and you can remove your avatar there. You can also ask the HackSpace team for a copy of your data or for your account to be deleted, and we will do it.",
    ],
  },
  {
    title: "9. Contact and changes",
    body: [
      "For any question about this policy or your data, contact the HackSpace team through the 42 intranet: hqannouc, aait-our, sel-maaq, aedarkao or sohamdan. If we change this policy, we will update the date below.",
    ],
  },
];

function PrivacyPolicy() {
  return (
    <div className="mx-auto max-w-3xl p-6">
      <h1 className="mb-2 text-3xl font-bold">Privacy Policy</h1>
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

export default PrivacyPolicy;
