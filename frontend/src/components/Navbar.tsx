import { useState } from "react";
import { Menu, X } from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { logout } from "@/api/auth";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { AuthenticatedUser } from "@/types/auth";

const navItemClass =
  "rounded-md px-3 py-2 text-base font-normal transition-colors";

const getNavLinkClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    navItemClass,
    "block focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
    isActive
      ? "bg-accent font-semibold text-foreground"
      : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
  );

const guestLinks = [
  { label: "Log in", to: "/login" },
  { label: "Register", to: "/register" },
];

const authenticatedLinks = [
  { label: "Explorer", to: "/hackathon-explorer" },
  { label: "Hackathons", to: "/hackathons" },
  { label: "Profile", to: "/profile" },
  { label: "Friends", to: "/friends" },
];

function Navbar({
  user,
  isLoading,
}: {
  user: AuthenticatedUser | undefined;
  isLoading: boolean;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const logoutMutation = useMutation({
    mutationFn: logout,
    onSuccess: () => {
      queryClient.setQueryData(["me"], null);
      queryClient.clear();
      setLogoutDialogOpen(false);
      setMenuOpen(false);
      navigate("/login", { replace: true });
    },
  });

  const handleLogout = () => {
    setLogoutDialogOpen(true);
  };

  const logoutButton = (
    <Button
      type="button"
      variant="ghost"
      className={cn(
        navItemClass,
        "h-auto text-muted-foreground hover:bg-accent/50 hover:text-foreground",
      )}
      disabled={logoutMutation.isPending}
      onClick={handleLogout}
    >
      Log out
    </Button>
  );

  const isAuthenticated = !!user;

  const navLinks = isAuthenticated ? authenticatedLinks : guestLinks;

  return (
    <nav
      aria-label="Main navigation"
      className="sticky top-0 z-50 border-b border-border bg-background px-4 py-4 sm:px-8"
    >
      <div className="flex items-center justify-between">
        <NavLink
          to="/"
          onClick={() => setMenuOpen(false)}
          className="text-xl font-bold tracking-tight focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-ring"
        >
          HackSpace
        </NavLink>

        <div className="hidden md:flex md:items-center md:gap-6">
          {!isLoading && (
            <>
              {navLinks.map((link) => (
                <NavLink key={link.to} to={link.to} className={getNavLinkClass}>
                  {link.label}
                </NavLink>
              ))}

              {isAuthenticated && logoutButton}
            </>
          )}
        </div>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="md:hidden"
          aria-expanded={menuOpen}
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-controls="mobile-navigation"
          onClick={() => setMenuOpen((prev) => !prev)}
        >
          {menuOpen ? <X /> : <Menu />}
        </Button>
      </div>

      <div id="mobile-navigation" className="md:hidden">
        {menuOpen && !isLoading && (
          <div className="flex flex-col items-end gap-1 pt-3">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                onClick={() => setMenuOpen(false)}
                className={getNavLinkClass}
              >
                {link.label}
              </NavLink>
            ))}

            {isAuthenticated && logoutButton}
          </div>
        )}
      </div>
      <AlertDialog open={logoutDialogOpen} onOpenChange={setLogoutDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Log out of HackSpace?</AlertDialogTitle>
            <AlertDialogDescription>
              You'll need to sign in again to access your account.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {logoutMutation.isError && (
            <p role="alert" className="text-sm text-destructive">
              Couldn't log out. Please try again.
            </p>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>

            <AlertDialogAction
              disabled={logoutMutation.isPending}
              onClick={() => logoutMutation.mutate()}
            >
              {logoutMutation.isPending ? "Logging out..." : "Log out"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </nav>
  );
}

export default Navbar;
