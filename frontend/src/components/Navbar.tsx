import { useState } from "react";
import { Menu, X } from "lucide-react";
import { NavLink } from "react-router-dom";

const getNavLinkClass = ({ isActive }: { isActive: boolean }) =>
  `block rounded-md px-3 py-2 transition-colors
   focus-visible:outline-2 focus-visible:outline-offset-2
   focus-visible:outline-black dark:focus-visible:outline-white
   ${
     isActive
       ? "bg-accent font-semibold text-foreground"
       : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
   }`;

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <nav className="px-8 py-4">
      <div className="flex items-center justify-between">
        <NavLink
          to="/"
          className="text-xl font-bold tracking-tight focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-black dark:focus-visible:outline-white"
        >
          HackSpace
        </NavLink>

        <div className="hidden md:flex md:items-center md:gap-6">
          <NavLink to="/hackathon-explorer" className={getNavLinkClass}>
            Explorer
          </NavLink>
          <NavLink to="/hackathons" className={getNavLinkClass}>
            Hackathons
          </NavLink>
        </div>

        <button
          type="button"
          className="rounded-md p-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black dark:focus-visible:outline-white md:hidden"
          aria-expanded={menuOpen}
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-controls="mobile-navigation"
          onClick={() => setMenuOpen((prev) => !prev)}
        >
          {menuOpen ? <X /> : <Menu />}
        </button>
      </div>

      <div id="mobile-navigation" className="md:hidden">
        {menuOpen && (
          <div className="flex flex-col items-end gap-1 pt-3">
            <NavLink
              onClick={() => setMenuOpen(false)}
              to="/hackathon-explorer"
              className={getNavLinkClass}
            >
              Explorer
            </NavLink>
            <NavLink
              onClick={() => setMenuOpen(false)}
              to="/hackathons"
              className={getNavLinkClass}
            >
              Hackathons
            </NavLink>
          </div>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
