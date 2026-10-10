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
import { HackathonFiltersType, HackathonPhaseName } from "@/types/hackathon";
import React, { useState } from "react";
import { DateRange } from "react-day-picker";
import { format } from "date-fns";


// This component provides search, phase, and date filters for hackathons.
// When submitted, it updates the filters and resets pagination to page 1.
export default function HackathonFilters({
  setFilters,
}: {
  setFilters: React.Dispatch<React.SetStateAction<HackathonFiltersType>>;
}) {
  const [search, setSearch] = useState("");
  const [phase, setPhase] = useState<HackathonPhaseName>();
  const [date, setDate] = useState<DateRange>();

  return (
    <form className="flex items-center gap-4 bg-white border p-5 rounded-xl flex-wrap" onSubmit={(e) => {
      e.preventDefault();
      setFilters((prev) => ({
        ...prev,
        search: search || undefined,
        phase,
        startDate: date?.from ? format(date.from, "yyyy-MM-dd") : undefined,
        endDate: date?.to ? format(date.to, "yyyy-MM-dd") : undefined,
        page: 1,
      }))
    }}>
      <Select
        onValueChange={(value) => {
          setPhase(value === "All" ? undefined : (value as HackathonPhaseName));
        }}
      >
        <SelectTrigger className="w-[25]">
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

      <Button type="submit" className="shrink-0">Search</Button>
    </form>
  );
}
