import { Link } from "react-router-dom";

function Footer() {
  return (
    <footer className="border-t">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-6 text-sm text-muted-foreground">
        <p>HackSpace · ft_transcendence project at 42</p>
        <nav aria-label="Legal" className="flex gap-6">
          <Link to="/privacy" className="hover:text-foreground hover:underline">
            Privacy Policy
          </Link>
          <Link to="/terms" className="hover:text-foreground hover:underline">
            Terms of Service
          </Link>
        </nav>
      </div>
    </footer>
  );
}

export default Footer;
