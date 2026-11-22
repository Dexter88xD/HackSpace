import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";

import { searchUsers } from "@/api/users";
import FriendshipButton from "@/components/friends/FriendshipButton";

export default function UserSearch() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 350);

    return () => clearTimeout(timer);
  }, [search]);

  const usersQuery = useQuery({
    queryKey: ["users", "search", debouncedSearch],
    queryFn: () => searchUsers(debouncedSearch),
    enabled: debouncedSearch.length >= 2 && debouncedSearch.length <= 50,
    retry: false,
  });

  const validSearch = search.trim().length >= 2 && search.trim().length <= 50;

  const searchIsCurrent = debouncedSearch === search.trim();

  return (
    <section className="mb-6 space-y-4 rounded-lg border p-4">
      <div>
        <h2 className="text-lg font-semibold">Find people</h2>
        <p className="text-sm text-muted-foreground">
          Search HackSpace members by username.
        </p>
      </div>

      <input
        type="search"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder="Search username..."
        aria-label="Search users"
        maxLength={50}
        className="w-full rounded-md border bg-background px-3 py-2 text-sm"
      />

      {search.length > 0 && !validSearch && (
        <p className="text-sm text-muted-foreground">
          Enter at least 2 characters.
        </p>
      )}

      {validSearch && !searchIsCurrent && (
        <p className="text-sm text-muted-foreground">Searching...</p>
      )}

      {validSearch && searchIsCurrent && usersQuery.isPending && (
        <p className="text-sm text-muted-foreground">Searching...</p>
      )}

      {validSearch && searchIsCurrent && usersQuery.isError && (
        <div className="space-y-2">
          <p role="alert" className="text-sm text-destructive">
            Could not search users.
          </p>
          <button
            type="button"
            onClick={() => void usersQuery.refetch()}
            className="text-sm underline"
          >
            Retry
          </button>
        </div>
      )}

      {validSearch &&
        searchIsCurrent &&
        usersQuery.isSuccess &&
        usersQuery.data.length === 0 && (
          <p className="text-sm text-muted-foreground">No users found.</p>
        )}

      {validSearch && searchIsCurrent && usersQuery.isSuccess && (
        <div className="space-y-3">
          {usersQuery.data.map((user) => (
            <div
              key={user.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-md border p-3"
            >
              <div>
                <Link
                  to={`/users/${user.id}`}
                  className="font-medium hover:underline"
                >
                  @{user.username}
                </Link>
                <p className="text-sm text-muted-foreground">{user.fullName}</p>
              </div>

              <FriendshipButton userId={user.id} />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
