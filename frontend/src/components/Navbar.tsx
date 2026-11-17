import { useState } from "react";
import { Menu, X } from "lucide-react";
import { NavLink } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getMe } from "../api/auth";

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
  const { data: user, isLoading } = useQuery({
    queryKey: ["me"],
    queryFn: getMe,
    retry: false,
  });

  const isAuthenticated = !!user;
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
          {!isLoading &&
            (isAuthenticated ? (
              <>
                <NavLink to="/hackathon-explorer" className={getNavLinkClass}>
                  Explorer
                </NavLink>
                <NavLink to="/hackathons" className={getNavLinkClass}>
                  Hackathons
                </NavLink>
                <NavLink to="/profile" className={getNavLinkClass}>
                  Profile
                </NavLink>
              </>
            ) : (
              <>
                <NavLink to="/login" className={getNavLinkClass}>
                  Log in
                </NavLink>
                <NavLink to="/register" className={getNavLinkClass}>
                  Register
                </NavLink>
              </>
            ))}
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
        {menuOpen && !isLoading && (
          <div className="flex flex-col items-end gap-1 pt-3">
            {isAuthenticated ? (
              <>
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
                <NavLink
                  onClick={() => setMenuOpen(false)}
                  to="/profile"
                  className={getNavLinkClass}
                >
                  Profile
                </NavLink>
              </>
            ) : (
              <>
                <NavLink
                  onClick={() => setMenuOpen(false)}
                  to="/login"
                  className={getNavLinkClass}
                >
                  Log in
                </NavLink>
                <NavLink
                  onClick={() => setMenuOpen(false)}
                  to="/register"
                  className={getNavLinkClass}
                >
                  Register
                </NavLink>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
