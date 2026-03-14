// Note 1: FilterBar is a controlled component. It keeps local draft state for
// form inputs so users can edit dates, tags, and search text without recomputing
// charts on every keystroke, but it still reflects the parent component's
// currently applied filters whenever quick filters are triggered elsewhere.
"use client";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import Autocomplete from "@mui/material/Autocomplete";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import FilterListIcon from "@mui/icons-material/FilterList";
import ClearIcon from "@mui/icons-material/Clear";
import { format, parseISO } from "date-fns";
import { useEffect, useState } from "react";

import {
  clearLastSelectedReportYears,
  setLastSelectedReportYears,
} from "@/lib/storage";
import { FilterParams } from "@/lib/types";

interface Props {
  availableTags: string[];
  availableYears: string[];
  filters: FilterParams;
  onChange: (filters: FilterParams) => void;
}

function parseFilterDate(value: string | null): Date | null {
  if (!value) {
    return null;
  }

  const parsed = parseISO(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function FilterBar({
  availableTags,
  availableYears,
  filters,
  onChange,
}: Props) {
  const [startDate, setStartDate] = useState<Date | null>(() =>
    parseFilterDate(filters.startDate),
  );
  const [endDate, setEndDate] = useState<Date | null>(() =>
    parseFilterDate(filters.endDate),
  );
  const [selectedTags, setSelectedTags] = useState<string[]>(
    () => filters.tags,
  );
  const [search, setSearch] = useState(() => filters.search);
  const [selectedYears, setSelectedYears] = useState<string[]>(
    () => filters.years,
  );

  // Note 2: Chart bars and table chips can apply filters from outside this form.
  // Syncing those parent-owned filters back into the local draft state keeps the
  // visible inputs honest without forcing manual edits to apply immediately.
  useEffect(() => {
    setStartDate(parseFilterDate(filters.startDate));
    setEndDate(parseFilterDate(filters.endDate));
    setSelectedTags(filters.tags);
    setSearch(filters.search);
    setSelectedYears(filters.years);
  }, [filters]);

  // Note 3: `applyFilters` converts the internal `Date` objects to "YYYY-MM-DD"
  // strings because `FilterParams.startDate` expects a string. Formatting the
  // local calendar date avoids the timezone shifts that `toISOString()` can
  // introduce for users outside UTC.
  function applyFilters(
    years: string[],
    sd: Date | null,
    ed: Date | null,
    tags: string[],
    q: string,
  ) {
    onChange({
      years,
      startDate: sd ? format(sd, "yyyy-MM-dd") : null,
      endDate: ed ? format(ed, "yyyy-MM-dd") : null,
      tags,
      search: q,
    });
  }

  // Note 4: The stored years track only the quick-year shortcut state. Persisting
  // the raw year tokens instead of synthetic date bounds means the app can restore
  // non-contiguous selections such as [2025, 2023] on the next visit.
  function persistAppliedYears(years: string[]) {
    if (years.length > 0) {
      setLastSelectedReportYears(years);
      return;
    }

    clearLastSelectedReportYears();
  }

  // Note 5: The quick year-picker applies immediately because it behaves like a
  // shortcut rather than a draft input. Selecting any year clears the custom date
  // range so the filter state never mixes one-off dates with explicit year tokens.
  function handleYearsChange(nextYears: string[]) {
    setSelectedYears(nextYears);
    setStartDate(null);
    setEndDate(null);
    persistAppliedYears(nextYears);
    applyFilters(nextYears, null, null, selectedTags, search);
  }

  function handleApply() {
    persistAppliedYears(selectedYears);
    applyFilters(selectedYears, startDate, endDate, selectedTags, search);
  }

  function handleReset() {
    setStartDate(null);
    setEndDate(null);
    setSelectedTags([]);
    setSearch("");
    setSelectedYears([]);
    clearLastSelectedReportYears();
    onChange({
      years: [],
      startDate: null,
      endDate: null,
      tags: [],
      search: "",
    });
  }

  return (
    <Paper sx={{ p: 2, mb: 3 }}>
      <Box display="flex" alignItems="center" gap={1} mb={2}>
        <FilterListIcon fontSize="small" color="primary" />
        <Typography variant="body2" fontWeight={600}>
          Filters
        </Typography>
      </Box>

      <Box mb={2}>
        <Typography
          variant="body2"
          fontWeight={500}
          color="text.secondary"
          sx={{ mb: 1 }}
        >
          Year
        </Typography>
        {availableYears.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            Add transactions to filter the reports by year.
          </Typography>
        ) : (
          <Box sx={{ overflowX: "auto", pb: 0.5 }}>
            <ToggleButtonGroup
              value={selectedYears}
              onChange={(_event, nextYears) =>
                handleYearsChange(Array.isArray(nextYears) ? nextYears : [])
              }
              size="small"
              aria-label="Filter reports by year"
              sx={{
                display: "inline-flex",
                flexWrap: "nowrap",
                minWidth: "max-content",
                gap: 1,
                "& .MuiToggleButtonGroup-grouped": {
                  borderRadius: 1,
                  borderColor: "divider",
                  px: 1.5,
                  textTransform: "none",
                  whiteSpace: "nowrap",
                },
              }}
            >
              {availableYears.map((year) => (
                <ToggleButton
                  key={year}
                  value={year}
                  aria-label={`Toggle reports year ${year}`}
                >
                  {year}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
          </Box>
        )}
      </Box>

      <Box display="flex" flexWrap="wrap" gap={2} alignItems="center">
        <DatePicker
          label="Start Date"
          value={startDate}
          onChange={(value) => {
            setStartDate(value);
            // Note 6: Selecting a specific date clears the quick-year shortcut to
            // avoid showing both a custom range and multiple explicit years as active.
            setSelectedYears([]);
          }}
          slotProps={{ textField: { size: "small", sx: { width: 170 } } }}
        />
        <DatePicker
          label="End Date"
          value={endDate}
          onChange={(value) => {
            setEndDate(value);
            setSelectedYears([]);
          }}
          slotProps={{ textField: { size: "small", sx: { width: 170 } } }}
        />
        {/* Note 7: MUI's Autocomplete with `multiple` renders a tag-list input.
            `limitTags={3}` collapses overflow tags into "+N more" text to keep
            the UI compact when many tags are selected. */}
        <Autocomplete
          multiple
          size="small"
          options={availableTags}
          value={selectedTags}
          onChange={(_event, value) => setSelectedTags(value)}
          renderInput={(params) => <TextField {...params} label="Tags" />}
          sx={{ minWidth: 220, flex: "1 1 220px" }}
          limitTags={3}
        />
        <TextField
          label="Search"
          size="small"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          // Note 8: `onKeyDown` with `event.key === "Enter"` lets the user submit
          // the search filter by pressing Enter without needing to click Apply.
          onKeyDown={(event) => event.key === "Enter" && handleApply()}
          sx={{ width: 180 }}
        />

        <Box
          display="flex"
          gap={1}
          alignItems="stretch"
          sx={{ minHeight: 40, ml: { lg: "auto" } }}
        >
          <Button
            variant="contained"
            size="small"
            onClick={handleApply}
            sx={{ minHeight: 40 }}
          >
            Apply
          </Button>
          <Button
            variant="outlined"
            size="small"
            startIcon={<ClearIcon />}
            onClick={handleReset}
            sx={{ minHeight: 40 }}
          >
            Reset
          </Button>
        </Box>
      </Box>
    </Paper>
  );
}
