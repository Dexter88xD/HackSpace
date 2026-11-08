import { useEffect, useId, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Plus, Search, X } from "lucide-react";
import { searchSkills } from "@/api/skills";
import { cleanSkillName, isValidSkillName } from "@/lib/profile-skills";
import { shouldRetryQuery } from "@/lib/query-retry";
import type { SelectedSkill } from "@/types/skill";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";

type Props = {
  selected: SelectedSkill[];
  onChange: (skills: SelectedSkill[]) => void;
  disabled: boolean;
  loading: boolean;
  loadError: boolean;
  onRetry: () => void;
};

export function ProfileSkillsField({
  selected,
  onChange,
  disabled,
  loading,
  loadError,
  onRetry,
}: Props) {
  const id = useId();
  const [search, setSearch] = useState("");
  const name = cleanSkillName(search);
  const [debouncedName, setDebouncedName] = useState("");
  useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedName(name), 300);
    return () => window.clearTimeout(timeout);
  }, [name]);

  const valid = isValidSkillName(name);
  const searchQuery = useQuery({
    queryKey: ["skills", "search", debouncedName],
    queryFn: ({ signal }) => searchSkills(debouncedName, signal),
    enabled: !disabled && valid && debouncedName === name,
    retry: shouldRetryQuery,
  });
  const isCurrent = name === debouncedName;
  const selectedNames = new Set(selected.map((skill) => skill.normalizedName));
  const results = searchQuery.data ?? [];
  const available = results.filter(
    (skill) => !selectedNames.has(skill.normalizedName),
  );
  const exactMatch = results.find(
    (skill) => skill.normalizedName === name.toLowerCase(),
  );
  const canCreate =
    valid &&
    isCurrent &&
    searchQuery.isSuccess &&
    !searchQuery.isFetching &&
    !exactMatch &&
    !selectedNames.has(name.toLowerCase());

  function select(skill: SelectedSkill) {
    if (disabled || selectedNames.has(skill.normalizedName)) return;
    onChange([...selected, skill]);
    setSearch("");
  }

  return (
    <Field>
      <FieldLabel htmlFor={id}>Skills</FieldLabel>
      {loading && (
        <p role="status" className="flex items-center gap-2 text-sm">
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          Loading your skills…
        </p>
      )}
      {loadError && (
        <FieldError>
          Could not load your skills.{" "}
          <Button type="button" variant="link" onClick={onRetry}>
            Retry loading skills
          </Button>
        </FieldError>
      )}
      {selected.length > 0 && (
        <ul aria-label="Selected skills" className="flex flex-wrap gap-2">
          {selected.map((skill) => (
            <li key={skill.normalizedName}>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="max-w-full whitespace-normal break-words text-left"
                disabled={disabled}
                aria-label={`Remove ${skill.name}`}
                onClick={() =>
                  onChange(
                    selected.filter(
                      (item) => item.normalizedName !== skill.normalizedName,
                    ),
                  )
                }
              >
                {skill.name}
                <X aria-hidden="true" />
              </Button>
            </li>
          ))}
        </ul>
      )}
      <span role="status" className="sr-only">
        {selected.length} skills selected
      </span>
      <InputGroup>
        <InputGroupAddon>
          <Search aria-hidden="true" />
        </InputGroupAddon>
        <InputGroupInput
          id={id}
          type="search"
          placeholder="Search skills…"
          value={search}
          disabled={disabled}
          autoComplete="off"
          aria-describedby={`${id}-hint${search.length > 0 && !valid ? ` ${id}-error` : ""}`}
          aria-invalid={search.length > 0 && !valid}
          onChange={(event) => setSearch(event.target.value)}
          onKeyDown={(event) => {
            if (event.key !== "Enter") return;
            event.preventDefault();
            if (
              event.nativeEvent.isComposing ||
              disabled ||
              !valid ||
              !isCurrent ||
              !searchQuery.isSuccess ||
              searchQuery.isFetching
            )
              return;

            if (exactMatch) {
              select(exactMatch);
            } else if (results.length === 0 && canCreate) {
              select({ name, normalizedName: name.toLowerCase() });
            }
          }}
        />
      </InputGroup>
      {search.length > 0 && !valid && (
        <FieldError id={`${id}-error`}>
          Enter 1–50 characters, including after lowercasing.
        </FieldError>
      )}
      {!disabled && valid && (
        <div aria-label="Skill search results" className="space-y-2">
          {(!isCurrent || searchQuery.isFetching) && (
            <p role="status" className="text-sm text-muted-foreground">
              Searching skills…
            </p>
          )}
          {isCurrent && searchQuery.isError && (
            <FieldError>
              Could not search skills.{" "}
              <Button
                type="button"
                variant="link"
                onClick={() => void searchQuery.refetch()}
              >
                Retry search
              </Button>
            </FieldError>
          )}
          {isCurrent && searchQuery.isSuccess && !searchQuery.isFetching && (
            <>
              {available.length > 0 ? (
                <ul className="max-h-48 overflow-y-auto rounded-lg border p-1">
                  {available.map((skill) => (
                    <li key={skill.id}>
                      <Button
                        type="button"
                        variant="ghost"
                        className="h-auto w-full justify-start whitespace-normal break-words py-2 text-left"
                        aria-label={`Add ${skill.name}`}
                        onClick={() => select(skill)}
                      >
                        <Plus aria-hidden="true" />
                        {skill.name}
                      </Button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p role="status" className="text-sm text-muted-foreground">
                  {results.length
                    ? "Matching skills are already selected."
                    : "No matching skills found."}
                </p>
              )}
              {canCreate && (
                <Button
                  type="button"
                  variant="outline"
                  className="h-auto max-w-full whitespace-normal break-words py-2 text-left"
                  onClick={() =>
                    select({ name, normalizedName: name.toLowerCase() })
                  }
                >
                  <Plus aria-hidden="true" />
                  Create “{name}”
                </Button>
              )}
            </>
          )}
        </div>
      )}
    </Field>
  );
}
