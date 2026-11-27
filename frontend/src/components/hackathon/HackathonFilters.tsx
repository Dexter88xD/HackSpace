import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "../ui/input-group";
import { DatePickerWithRange } from "./DatePickerWithRange";
import { Button } from "../ui/button";
import {
  Select,
  SelectContent,
  SelectTrigger,
  SelectValue,
  SelectItem,
} from "../ui/select";
import { SearchIcon } from "lucide-react";
import {
  HackathonFiltersType,
  HackathonPhaseName,
  HackathonSortField,
  SortOrder,
} from "@/types/hackathon";
import React, { useState } from "react";
import { DateRange } from "react-day-picker";
import { format } from "date-fns";

const sortOptions: Record<
  string,
  {
    sortBy?: HackathonSortField;
    sortOrder?: SortOrder;
    label: string;
    upcomingOnly?: boolean;
  }
> = {
  default: {
    label: "Default order",
  },

  "startAt:asc": {
    sortBy: HackathonSortField.START_AT,
    sortOrder: SortOrder.ASC,
    label: "Starting soonest",
    upcomingOnly: true,
  },

  "startAt:desc": {
    sortBy: HackathonSortField.START_AT,
    sortOrder: SortOrder.DESC,
    label: "Starting latest",
  },

  "title:asc": {
    sortBy: HackathonSortField.TITLE,
    sortOrder: SortOrder.ASC,
    label: "Title A–Z",
  },

  "title:desc": {
    sortBy: HackathonSortField.TITLE,
    sortOrder: SortOrder.DESC,
    label: "Title Z–A",
  },

  "createdAt:asc": {
    sortBy: HackathonSortField.CREATED_AT,
    sortOrder: SortOrder.ASC,
    label: "Oldest created",
  },

  "createdAt:desc": {
    sortBy: HackathonSortField.CREATED_AT,
    sortOrder: SortOrder.DESC,
    label: "Newest created",
  },
};

// Provides search, phase, date, and sorting controls.
// Sorting applies immediately; other filters apply on form submission.
export default function HackathonFilters({
  setFilters,
  filters,
}: {
  setFilters: React.Dispatch<React.SetStateAction<HackathonFiltersType>>;
  filters: HackathonFiltersType;
}) {
  const [search, setSearch] = useState("");
  const [phase, setPhase] = useState<HackathonPhaseName>();
  const [date, setDate] = useState<DateRange>();
  const selectedSortKey =
    filters.sortBy && filters.sortOrder
      ? `${filters.sortBy}:${filters.sortOrder}`
      : "default";

  return (
    <form
      className="grid min-w-0 grid-cols-1 gap-3 rounded-xl border bg-card p-4 sm:grid-cols-2 lg:grid-cols-[10rem_11rem_minmax(0,1fr)_15rem_auto] lg:items-center"
      onSubmit={(e) => {
        e.preventDefault();
        setFilters((prev) => ({
          ...prev,
          search: search || undefined,
          phase,
          startDate: date?.from ? format(date.from, "yyyy-MM-dd") : undefined,
          endDate: date?.to ? format(date.to, "yyyy-MM-dd") : undefined,
          page: 1,
        }));
      }}
    >
      <Select
        onValueChange={(value) => {
          setPhase(value === "All" ? undefined : (value as HackathonPhaseName));
        }}
      >
        <SelectTrigger className="w-full min-w-0">
          <SelectValue placeholder="Phase" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="All">All Phases</SelectItem>
          <SelectItem value={HackathonPhaseName.LAUNCH}>Launch</SelectItem>
          <SelectItem value={HackathonPhaseName.REGISTRATION}>
            Registration
          </SelectItem>
          <SelectItem value={HackathonPhaseName.IN_PROGRESS}>
            In progress
          </SelectItem>
          <SelectItem value={HackathonPhaseName.EVALUATION}>
            Evaluation
          </SelectItem>
          <SelectItem value={HackathonPhaseName.FINISHED}>Finished</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={selectedSortKey}
        onValueChange={(value) => {
          if (typeof value !== "string") return;

          const selectedSort = sortOptions[value];
          if (!selectedSort) return;

          setFilters((prev) => ({
            ...prev,
            sortBy: selectedSort.sortBy,
            sortOrder: selectedSort.sortOrder,
            upcomingOnly: selectedSort.upcomingOnly,
            page: 1,
          }));
        }}
      >
        <SelectTrigger className="w-full min-w-0">
          <SelectValue placeholder="Sort by">
            {selectedSortKey ? sortOptions[selectedSortKey]?.label : undefined}
          </SelectValue>
        </SelectTrigger>

        <SelectContent>
          {Object.entries(sortOptions).map(([key, option]) => (
            <SelectItem key={key} value={key}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="min-w-0 w-full">
        <InputGroup className="min-w-0 w-full">
          <InputGroupInput
            type="search"
            placeholder="Search hackathons..."
            maxLength={50}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <InputGroupAddon>
            <SearchIcon />
          </InputGroupAddon>
        </InputGroup>
      </div>

      <div className="shrink-0">
        <DatePickerWithRange onDateChange={setDate} />
      </div>

      <Button
        type="submit"
        className="w-full sm:col-span-2 lg:col-span-1 lg:w-auto"
      >
        Search
      </Button>
    </form>
  );
}
