// Note 1: FilterBar is a controlled component. It keeps local draft state for
// form inputs so users can edit dates, tags, and search text without recomputing
// charts on every keystroke, but it still reflects the parent component's
// currently applied filters whenever quick filters are triggered elsewhere.
"use client";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import Autocomplete from "@mui/material/Autocomplete";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import FilterListIcon from "@mui/icons-material/FilterList";
import ClearIcon from "@mui/icons-material/Clear";
import { format, parseISO } from "date-fns";
import { useEffect, useState } from "react";

import { createYearDateRange } from "@/lib/aggregations";
import {
  clearLastSelectedReportYear,
  setLastSelectedReportYear,
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

function buildYearBounds(year: string): { startDate: Date; endDate: Date } {
  const { startDate, endDate } = createYearDateRange(year);

  return {
    startDate: parseFilterDate(startDate) ?? new Date(Number(year), 0, 1),
    endDate: parseFilterDate(endDate) ?? new Date(Number(year), 11, 31),
  };
}

function deriveActiveYear(
  filters: FilterParams,
  availableYears: string[],
): string | null {
  if (!filters.startDate || !filters.endDate) {
    return null;
  }

  const startMatch = filters.startDate.match(/^(\d{4})-01-01$/);
  const endMatch = filters.endDate.match(/^(\d{4})-12-31$/);

  if (!startMatch || !endMatch || startMatch[1] !== endMatch[1]) {
    return null;
  }

  return availableYears.includes(startMatch[1]) ? startMatch[1] : null;
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
  const [activeYear, setActiveYear] = useState<string | null>(() =>
    deriveActiveYear(filters, availableYears),
  );

  // Note 2: Chart bars and table chips can apply filters from outside this form.
  // Syncing those parent-owned filters back into the local draft state keeps the
  // visible inputs honest without forcing manual edits to apply immediately.
  useEffect(() => {
    setStartDate(parseFilterDate(filters.startDate));
    setEndDate(parseFilterDate(filters.endDate));
    setSelectedTags(filters.tags);
    setSearch(filters.search);
    setActiveYear(deriveActiveYear(filters, availableYears));
  }, [availableYears, filters]);

  // Note 3: `applyFilters` converts the internal `Date` objects to "YYYY-MM-DD"
  // strings because `FilterParams.startDate` expects a string. Formatting the
  // local calendar date avoids the timezone shifts that `toISOString()` can
  // introduce for users outside UTC.
  function applyFilters(
    sd: Date | null,
    ed: Date | null,
    tags: string[],
    q: string,
  ) {
    onChange({
      startDate: sd ? format(sd, "yyyy-MM-dd") : null,
      endDate: ed ? format(ed, "yyyy-MM-dd") : null,
      tags,
      search: q,
    });
  }

  // Note 4: The stored year tracks the last applied quick-year selection rather
  // than every intermediate edit. This keeps startup behavior aligned with the
  // actual reports view the user chose to apply.
  function persistAppliedYear(year: string | null) {
    if (year) {
      setLastSelectedReportYear(year);
      return;
    }

    clearLastSelectedReportYear();
  }

  // Note 5: Clicking an already-active year tab toggles it off. That preserves
  // the same discoverable quick-filter behavior the old chip row had while using
  // scrollable tabs that scale better when many years are available.
  function handleYearClick(year: string) {
    if (activeYear === year) {
      setActiveYear(null);
      setStartDate(null);
      setEndDate(null);
      persistAppliedYear(null);
      applyFilters(null, null, selectedTags, search);
      return;
    }

    const { startDate: sd, endDate: ed } = buildYearBounds(year);
    setActiveYear(year);
    setStartDate(sd);
    setEndDate(ed);
    persistAppliedYear(year);
    applyFilters(sd, ed, selectedTags, search);
  }

  function handleApply() {
    persistAppliedYear(activeYear);
    applyFilters(startDate, endDate, selectedTags, search);
  }

  function handleReset() {
    setStartDate(null);
    setEndDate(null);
    setSelectedTags([]);
    setSearch("");
    setActiveYear(null);
    clearLastSelectedReportYear();
    onChange({ startDate: null, endDate: null, tags: [], search: "" });
  }

  return (
    <Paper sx={{ p: 2, mb: 3 }}>
      <Box display="flex" alignItems="center" gap={1} mb={2}>
        <FilterListIcon fontSize="small" color="primary" />
        <Typography variant="body2" fontWeight={600}>
          Filters
        </Typography>
      </Box>

      <Box display="flex" flexWrap="wrap" gap={2} alignItems="center">
        <DatePicker
          label="Start Date"
          value={startDate}
          onChange={(value) => {
            setStartDate(value);
            // Note 6: Selecting a specific date clears the active year shortcut to
            // avoid the confusion of showing both a canned year range and a custom
            // date range as active at the same time.
            setActiveYear(null);
          }}
          slotProps={{ textField: { size: "small", sx: { width: 170 } } }}
        />
        <DatePicker
          label="End Date"
          value={endDate}
          onChange={(value) => {
            setEndDate(value);
            setActiveYear(null);
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
          onChange={(_, value) => setSelectedTags(value)}
          renderInput={(params) => <TextField {...params} label="Tags" />}
          sx={{ minWidth: 220, flex: "1 1 220px" }}
          limitTags={3}
        />
        <TextField
          label="Search"
          size="small"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          // Note 8: `onKeyDown` with `e.key === "Enter"` lets the user submit
          // the search filter by pressing Enter without needing to click Apply.
          onKeyDown={(event) => event.key === "Enter" && handleApply()}
          sx={{ width: 180 }}
        />
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            flex: "1 1 340px",
            minWidth: { xs: "100%", lg: 340 },
            overflow: "hidden",
          }}
        >
          <Typography
            variant="body2"
            fontWeight={500}
            color="text.secondary"
            sx={{ whiteSpace: "nowrap" }}
          >
            Year
          </Typography>
          <Tabs
            value={activeYear ?? false}
            variant="scrollable"
            scrollButtons="auto"
            allowScrollButtonsMobile
            sx={{
              minHeight: 40,
              flex: 1,
              minWidth: 0,
              "& .MuiTab-root": {
                minHeight: 40,
                minWidth: 72,
                px: 1.5,
                py: 0.5,
                textTransform: "none",
              },
            }}
          >
            {availableYears.map((year) => (
              <Tab
                key={year}
                label={year}
                value={year}
                onClick={() => handleYearClick(year)}
              />
            ))}
          </Tabs>
        </Box>
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
