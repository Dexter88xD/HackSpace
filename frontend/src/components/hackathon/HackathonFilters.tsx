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
    sortBy: HackathonSortField;
    sortOrder: SortOrder;
    label: string;
  }
> = {
  "startAt:asc": {
    sortBy: HackathonSortField.START_AT,
    sortOrder: SortOrder.ASC,
    label: "Starting soonest",
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
      : null;

  return (
    <form
      className="flex items-center gap-4 bg-white border p-5 rounded-xl flex-wrap"
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
        <SelectTrigger className="w-full sm:w-40">
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
            page: 1,
          }));
        }}
      >
        <SelectTrigger className="w-full sm:w-44">
          <SelectValue placeholder="Sort by">
            {selectedSortKey ? sortOptions[selectedSortKey]?.label : undefined}
          </SelectValue>
        </SelectTrigger>

        <SelectContent>
          <SelectItem value={`${HackathonSortField.START_AT}:${SortOrder.ASC}`}>
            Starting soonest
          </SelectItem>

          <SelectItem
            value={`${HackathonSortField.START_AT}:${SortOrder.DESC}`}
          >
            Starting latest
          </SelectItem>
          <SelectItem value={`${HackathonSortField.TITLE}:${SortOrder.ASC}`}>
            Title A–Z
          </SelectItem>
          <SelectItem value={`${HackathonSortField.TITLE}:${SortOrder.DESC}`}>
            Title Z–A
          </SelectItem>
          <SelectItem
            value={`${HackathonSortField.CREATED_AT}:${SortOrder.ASC}`}
          >
            Oldest created
          </SelectItem>
          <SelectItem
            value={`${HackathonSortField.CREATED_AT}:${SortOrder.DESC}`}
          >
            Newest created
          </SelectItem>
        </SelectContent>
      </Select>

      <div className="flex-1 min-w-[250px]">
        <InputGroup className="flex-1">
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

      <Button type="submit" className="shrink-0">
        Search
      </Button>
    </form>
  );
}
