// Note 1: FilterBar is a controlled component. It holds its own internal state
// for the form fields (dates, tags, search), but delegates the "applied filter"
// state to the parent via the `onChange` callback. This separation means the
// parent only sees validated/applied filter values, not every keystroke.
"use client";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Paper from "@mui/material/Paper";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import Autocomplete from "@mui/material/Autocomplete";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import FilterListIcon from "@mui/icons-material/FilterList";
import ClearIcon from "@mui/icons-material/Clear";
import { useState } from "react";
import { FilterParams } from "@/lib/types";

const QUICK_YEARS = ["2021", "2022", "2023", "2024", "2025", "2026"];

interface Props {
  availableTags: string[];
  onChange: (filters: FilterParams) => void;
}

export function FilterBar({ availableTags, onChange }: Props) {
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [activeYear, setActiveYear] = useState<string | null>(null);

  // Note 2: `applyFilters` converts the internal `Date` objects to "YYYY-MM-DD"
  // ISO strings because `FilterParams.startDate` expects a string. The `.split("T")[0]`
  // strips the time component that `toISOString()` appends (e.g. "2024-01-01T00:00:00.000Z").
  function applyFilters(
    sd: Date | null,
    ed: Date | null,
    tags: string[],
    q: string,
  ) {
    onChange({
      startDate: sd ? sd.toISOString().split("T")[0] : null,
      endDate: ed ? ed.toISOString().split("T")[0] : null,
      tags,
      search: q,
    });
  }

  // Note 3: Clicking an already-active year chip deselects it (toggle behavior).
  // This avoids needing a separate "clear year" button and makes the UI more
  // discoverable -- the same element that applies a filter also removes it.
  function handleYearClick(year: string) {
    if (activeYear === year) {
      setActiveYear(null);
      setStartDate(null);
      setEndDate(null);
      applyFilters(null, null, selectedTags, search);
    } else {
      setActiveYear(year);
      const sd = new Date(`${year}-01-01`);
      const ed = new Date(`${year}-12-31`);
      setStartDate(sd);
      setEndDate(ed);
      applyFilters(sd, ed, selectedTags, search);
    }
  }

  function handleApply() {
    applyFilters(startDate, endDate, selectedTags, search);
  }

  function handleReset() {
    setStartDate(null);
    setEndDate(null);
    setSelectedTags([]);
    setSearch("");
    setActiveYear(null);
    onChange({ startDate: null, endDate: null, tags: [], search: "" });
  }

  return (
    <Paper sx={{ p: 2, mb: 3 }}>
      <Box display="flex" alignItems="center" gap={1} mb={2} flexWrap="wrap">
        <FilterListIcon fontSize="small" color="primary" />
        <Typography variant="body2" fontWeight={600}>
          Filters
        </Typography>
        {/* Note 4: `flex={1}` on an empty Box is a flexbox spacer. It expands
            to fill all remaining space between the "Filters" label and the year
            chips, pushing the chips to the right edge of the bar. */}
        <Box flex={1} />
        {QUICK_YEARS.map((y) => (
          <Chip
            key={y}
            label={y}
            size="small"
            clickable
            color={activeYear === y ? "primary" : "default"}
            onClick={() => handleYearClick(y)}
          />
        ))}
      </Box>

      <Box display="flex" flexWrap="wrap" gap={2} alignItems="flex-end">
        <DatePicker
          label="Start Date"
          value={startDate}
          onChange={(val) => {
            setStartDate(val);
            // Note 5: Selecting a specific date clears the active year chip to
            // avoid the confusion of having both a year quick-filter and a
            // custom date range active at the same time.
            setActiveYear(null);
          }}
          slotProps={{ textField: { size: "small", sx: { width: 170 } } }}
        />
        <DatePicker
          label="End Date"
          value={endDate}
          onChange={(val) => {
            setEndDate(val);
            setActiveYear(null);
          }}
          slotProps={{ textField: { size: "small", sx: { width: 170 } } }}
        />
        {/* Note 6: MUI's Autocomplete with `multiple` renders a tag-list input.
            `limitTags={3}` collapses overflow tags into "+N more" text to keep
            the UI compact when many tags are selected. */}
        <Autocomplete
          multiple
          size="small"
          options={availableTags}
          value={selectedTags}
          onChange={(_, val) => setSelectedTags(val)}
          renderInput={(params) => <TextField {...params} label="Tags" />}
          sx={{ minWidth: 220 }}
          limitTags={3}
        />
        <TextField
          label="Search"
          size="small"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          // Note 7: `onKeyDown` with `e.key === "Enter"` lets the user submit
          // the search filter by pressing Enter without needing to click Apply.
          onKeyDown={(e) => e.key === "Enter" && handleApply()}
          sx={{ width: 180 }}
        />
        <Button variant="contained" size="small" onClick={handleApply}>
          Apply
        </Button>
        <Button
          variant="outlined"
          size="small"
          startIcon={<ClearIcon />}
          onClick={handleReset}
        >
          Reset
        </Button>
      </Box>
    </Paper>
  );
}
