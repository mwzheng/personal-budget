// Note 1: FilterBar is a controlled component with collapsible advanced filters.
// The summary row shows active filter count and quick year toggles. Expanding the
// panel reveals date range, category, tag, and search inputs. This two-tier design
// keeps the common case (year selection) one click away while hiding advanced
// filters until needed.
"use client";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Collapse from "@mui/material/Collapse";
import IconButton from "@mui/material/IconButton";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Autocomplete from "@mui/material/Autocomplete";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import FilterListIcon from "@mui/icons-material/FilterList";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ClearIcon from "@mui/icons-material/Close";
import { format, parseISO } from "date-fns";
import { useEffect, useMemo, useState } from "react";

import {
  clearLastSelectedReportYears,
  setLastSelectedReportYears,
} from "@/lib/utils/storage";
import { FilterParams, TransactionCategoryType } from "@/lib/types/types";
import { TRANSACTION_CATEGORY_OPTIONS } from "@/lib/utils/transaction-categories";

interface Props {
  availableTags: string[];
  availableYears: string[];
  filters: FilterParams;
  onChange: (filters: FilterParams) => void;
}

function parseFilterDate(value: string | null): Date | null {
  if (!value) return null;
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
  const [selectedCategories, setSelectedCategories] = useState<
    TransactionCategoryType[]
  >(() => filters.categories);
  const [search, setSearch] = useState(() => filters.search);
  const [selectedYears, setSelectedYears] = useState<string[]>(
    () => filters.years,
  );
  const [expanded, setExpanded] = useState(false);

  // Sync external filter changes (e.g. from chart tag clicks) back into local state.
  useEffect(() => {
    setStartDate(parseFilterDate(filters.startDate));
    setEndDate(parseFilterDate(filters.endDate));
    setSelectedCategories(filters.categories);
    setSelectedTags(filters.tags);
    setSearch(filters.search);
    setSelectedYears(filters.years);
  }, [filters]);

  // Count how many advanced filters are active.
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.startDate || filters.endDate) count += 1;
    if (filters.categories.length > 0) count += 1;
    if (filters.tags.length > 0) count += 1;
    if (filters.search) count += 1;
    return count;
  }, [filters]);

  function applyFilters(
    years: string[],
    sd: Date | null,
    ed: Date | null,
    categories: TransactionCategoryType[],
    tags: string[],
    q: string,
  ) {
    onChange({
      years,
      startDate: sd ? format(sd, "yyyy-MM-dd") : null,
      endDate: ed ? format(ed, "yyyy-MM-dd") : null,
      categories,
      tags,
      search: q,
    });
  }

  function persistAppliedYears(years: string[]) {
    if (years.length > 0) {
      setLastSelectedReportYears(years);
      return;
    }
    clearLastSelectedReportYears();
  }

  function handleYearsChange(nextYears: string[]) {
    setSelectedYears(nextYears);
    setStartDate(null);
    setEndDate(null);
    persistAppliedYears(nextYears);
    applyFilters(
      nextYears,
      null,
      null,
      selectedCategories,
      selectedTags,
      search,
    );
  }

  function handleApply() {
    persistAppliedYears(selectedYears);
    applyFilters(
      selectedYears,
      startDate,
      endDate,
      selectedCategories,
      selectedTags,
      search,
    );
  }

  function handleReset() {
    setStartDate(null);
    setEndDate(null);
    setSelectedCategories([]);
    setSelectedTags([]);
    setSearch("");
    setSelectedYears([]);
    clearLastSelectedReportYears();
    onChange({
      years: [],
      startDate: null,
      endDate: null,
      categories: [],
      tags: [],
      search: "",
    });
  }

  return (
    <Paper sx={{ mb: 3 }}>
      {/* Summary row: year toggles + expand/collapse + filter badge */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          px: { xs: 2, sm: 2.5 },
          py: 1.5,
          flexWrap: "wrap",
        }}
      >
        <FilterListIcon sx={{ fontSize: 18, color: "text.secondary" }} />

        {/* Year toggles always visible */}
        {availableYears.length > 0 && (
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
              gap: 0.5,
              "& .MuiToggleButtonGroup-grouped": {
                borderRadius: 1,
                borderColor: "divider",
                px: 1.5,
                py: 0.25,
                textTransform: "none",
                whiteSpace: "nowrap",
                fontSize: "0.8125rem",
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
        )}

        {/* Spacer and expand toggle */}
        <Box sx={{ flex: 1 }} />

        {/* Active filter badge */}
        {activeFilterCount > 0 && (
          <Chip
            label={`${activeFilterCount} active`}
            size="small"
            color="primary"
            variant="outlined"
            onDelete={handleReset}
            sx={{ height: 24, fontSize: "0.75rem" }}
          />
        )}

        <IconButton
          size="small"
          onClick={() => setExpanded((prev) => !prev)}
          aria-label={expanded ? "Collapse filters" : "Expand filters"}
          sx={{ color: "text.secondary" }}
        >
          {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        </IconButton>
      </Box>

      {/* Advanced filters panel */}
      <Collapse in={expanded}>
        <Box
          sx={{
            px: { xs: 2, sm: 2.5 },
            pb: 2,
            pt: 0.5,
            borderTop: (theme) => `1px solid ${theme.palette.divider}`,
          }}
        >
          <Stack spacing={2} sx={{ mt: 2 }}>
            {/* Date range row */}
            <Box display="flex" flexWrap="wrap" gap={2} alignItems="center">
              <DatePicker
                label="Start Date"
                value={startDate}
                onChange={(value) => {
                  setStartDate(value);
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
            </Box>

            {/* Category and tags row */}
            <Box display="flex" flexWrap="wrap" gap={2} alignItems="center">
              <Autocomplete
                multiple
                size="small"
                options={TRANSACTION_CATEGORY_OPTIONS}
                value={selectedCategories}
                onChange={(_event, value) =>
                  setSelectedCategories(value as TransactionCategoryType[])
                }
                renderInput={(params) => (
                  <TextField {...params} label="Category" />
                )}
                sx={{ minWidth: 200, flex: "1 1 200px" }}
                limitTags={3}
              />
              <Autocomplete
                multiple
                size="small"
                options={availableTags}
                value={selectedTags}
                onChange={(_event, value) => setSelectedTags(value)}
                renderInput={(params) => <TextField {...params} label="Tags" />}
                sx={{ minWidth: 200, flex: "1 1 200px" }}
                limitTags={3}
              />
            </Box>

            {/* Search and actions row */}
            <Box display="flex" flexWrap="wrap" gap={2} alignItems="center">
              <TextField
                label="Search"
                size="small"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                onKeyDown={(event) => event.key === "Enter" && handleApply()}
                sx={{ minWidth: 200, flex: "1 1 200px" }}
              />
              <Box display="flex" gap={1} sx={{ ml: { md: "auto" } }}>
                <Button
                  variant="contained"
                  size="small"
                  onClick={handleApply}
                  sx={{ minHeight: 36 }}
                >
                  Apply
                </Button>
                <Button
                  variant="text"
                  size="small"
                  startIcon={<ClearIcon />}
                  onClick={handleReset}
                  sx={{ minHeight: 36 }}
                >
                  Reset
                </Button>
              </Box>
            </Box>
          </Stack>
        </Box>
      </Collapse>
    </Paper>
  );
}
