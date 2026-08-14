// FilterBar is controlled by applied parent filters while the advanced panel keeps
// a local draft until Apply. Date presets and year toggles are intentionally
// immediate because they are the common report-navigation controls.
"use client";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Badge from "@mui/material/Badge";
import Chip from "@mui/material/Chip";
import Collapse from "@mui/material/Collapse";
import ListSubheader from "@mui/material/ListSubheader";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Autocomplete from "@mui/material/Autocomplete";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import FilterListIcon from "@mui/icons-material/FilterList";
import ClearIcon from "@mui/icons-material/Close";
import { format, parseISO } from "date-fns";
import { useEffect, useMemo, useState } from "react";

import { FilterParams, TransactionCategoryType } from "@/lib/types/types";
import {
  getReportDateRangePreset,
  ReportDateRangePreset,
} from "@/lib/utils/aggregations";
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

const DATE_RANGE_PRESETS: Array<{
  label: string;
  value: ReportDateRangePreset;
}> = [
  { label: "This month", value: "this-month" },
  { label: "Last month", value: "last-month" },
  { label: "This quarter", value: "this-quarter" },
  { label: "Last quarter", value: "last-quarter" },
  { label: "This year", value: "this-year" },
  { label: "Last year", value: "last-year" },
  { label: "Last 90 days", value: "last-90-days" },
  { label: "All time", value: "all-time" },
  { label: "Custom", value: "custom" },
];

const DATE_RANGE_MENU_GROUPS: Array<{
  label: string;
  presets: ReportDateRangePreset[];
}> = [
  { label: "Relative", presets: ["last-90-days"] },
  {
    label: "Calendar",
    presets: [
      "this-month",
      "last-month",
      "this-quarter",
      "last-quarter",
      "this-year",
      "last-year",
    ],
  },
  { label: "Other", presets: ["all-time", "custom"] },
];

const PRESET_LABELS = new Map(
  DATE_RANGE_PRESETS.map((preset) => [preset.value, preset.label]),
);

function getSelectedDateRangePreset(
  filters: FilterParams,
): ReportDateRangePreset | null {
  if (filters.years.length > 0) return null;

  if (!filters.startDate && !filters.endDate) return "all-time";

  for (const preset of DATE_RANGE_PRESETS) {
    if (preset.value === "all-time" || preset.value === "custom") continue;
    const range = getReportDateRangePreset(preset.value);
    if (
      filters.startDate === range.startDate &&
      filters.endDate === range.endDate
    ) {
      return preset.value;
    }
  }

  return "custom";
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
  const [selectedDateRangePreset, setSelectedDateRangePreset] =
    useState<ReportDateRangePreset | null>(() =>
      getSelectedDateRangePreset(filters),
    );
  const [expanded, setExpanded] = useState(false);
  const [dateRangeMenuAnchor, setDateRangeMenuAnchor] =
    useState<HTMLElement | null>(null);

  // Sync external filter changes (e.g. from chart tag clicks) back into local state.
  useEffect(() => {
    setStartDate(parseFilterDate(filters.startDate));
    setEndDate(parseFilterDate(filters.endDate));
    setSelectedCategories(filters.categories);
    setSelectedTags(filters.tags);
    setSearch(filters.search);
    setSelectedYears(filters.years);
    setSelectedDateRangePreset(getSelectedDateRangePreset(filters));
  }, [filters]);

  // Count individual applied filters for the More filters badge.
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.startDate || filters.endDate) count += 1;
    count += filters.years.length;
    count += filters.categories.length;
    count += filters.tags.length;
    if (filters.search) count += 1;
    return count;
  }, [filters]);

  const dateRangeChipLabel = useMemo(() => {
    const presetLabel = selectedDateRangePreset
      ? PRESET_LABELS.get(selectedDateRangePreset)
      : undefined;

    if (presetLabel && selectedDateRangePreset !== "custom") {
      return `Date: ${presetLabel}`;
    }

    if (filters.startDate && filters.endDate) {
      return `Date: ${filters.startDate} – ${filters.endDate}`;
    }
    if (filters.startDate) return `From: ${filters.startDate}`;
    return `Until: ${filters.endDate}`;
  }, [filters.endDate, filters.startDate, selectedDateRangePreset]);

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

  function handleYearsChange(nextYears: string[]) {
    setSelectedYears(nextYears);
    setStartDate(null);
    setEndDate(null);
    setSelectedDateRangePreset(null);
    applyFilters(
      nextYears,
      null,
      null,
      filters.categories,
      filters.tags,
      filters.search,
    );
  }

  function handleDateRangePreset(preset: ReportDateRangePreset) {
    setDateRangeMenuAnchor(null);

    if (preset === "custom") {
      setSelectedDateRangePreset("custom");
      setExpanded(true);
      return;
    }

    const range = getReportDateRangePreset(preset);
    const nextStartDate = parseFilterDate(range.startDate);
    const nextEndDate = parseFilterDate(range.endDate);

    setSelectedDateRangePreset(preset);
    setStartDate(nextStartDate);
    setEndDate(nextEndDate);
    setSelectedYears([]);
    applyFilters(
      [],
      nextStartDate,
      nextEndDate,
      filters.categories,
      filters.tags,
      filters.search,
    );
  }

  function handleRemoveDateRange() {
    setStartDate(null);
    setEndDate(null);
    setSelectedDateRangePreset("all-time");
    applyFilters(
      filters.years,
      null,
      null,
      filters.categories,
      filters.tags,
      filters.search,
    );
  }

  function handleRemoveYear(year: string) {
    const nextYears = filters.years.filter(
      (selectedYear) => selectedYear !== year,
    );
    setSelectedYears(nextYears);
    applyFilters(
      nextYears,
      null,
      null,
      filters.categories,
      filters.tags,
      filters.search,
    );
  }

  function handleRemoveCategory(category: TransactionCategoryType) {
    const nextCategories = filters.categories.filter(
      (item) => item !== category,
    );
    setSelectedCategories((current) =>
      current.filter((item) => item !== category),
    );
    applyFilters(
      filters.years,
      parseFilterDate(filters.startDate),
      parseFilterDate(filters.endDate),
      nextCategories,
      filters.tags,
      filters.search,
    );
  }

  function handleRemoveTag(tag: string) {
    const nextTags = filters.tags.filter((item) => item !== tag);
    setSelectedTags((current) => current.filter((item) => item !== tag));
    applyFilters(
      filters.years,
      parseFilterDate(filters.startDate),
      parseFilterDate(filters.endDate),
      filters.categories,
      nextTags,
      filters.search,
    );
  }

  function handleRemoveSearch() {
    setSearch("");
    applyFilters(
      filters.years,
      parseFilterDate(filters.startDate),
      parseFilterDate(filters.endDate),
      filters.categories,
      filters.tags,
      "",
    );
  }

  function handleApply() {
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
    setSelectedDateRangePreset("all-time");
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
      {/* Toolbar */}
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
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            flexShrink: 0,
          }}
        >
          <Button
            variant="outlined"
            size="small"
            onClick={(event) => setDateRangeMenuAnchor(event.currentTarget)}
            aria-label="Choose report date range"
            aria-haspopup="menu"
            aria-expanded={Boolean(dateRangeMenuAnchor)}
            aria-controls={
              dateRangeMenuAnchor ? "report-date-range-menu" : undefined
            }
            sx={{ minHeight: 36, textTransform: "none" }}
          >
            Date range
            {selectedDateRangePreset
              ? `: ${PRESET_LABELS.get(selectedDateRangePreset)}`
              : ""}
          </Button>
          <Badge
            badgeContent={activeFilterCount}
            color="primary"
            invisible={activeFilterCount === 0}
          >
            <Button
              variant="outlined"
              size="small"
              startIcon={<FilterListIcon />}
              onClick={() => setExpanded((prev) => !prev)}
              aria-expanded={expanded}
              aria-controls="report-advanced-filters"
              aria-label={expanded ? "Hide more filters" : "Show more filters"}
              sx={{ minHeight: 36, textTransform: "none" }}
            >
              More filters
            </Button>
          </Badge>
        </Box>
        <Menu
          id="report-date-range-menu"
          anchorEl={dateRangeMenuAnchor}
          open={Boolean(dateRangeMenuAnchor)}
          onClose={() => setDateRangeMenuAnchor(null)}
          MenuListProps={{ "aria-label": "Report date range options" }}
        >
          {DATE_RANGE_MENU_GROUPS.flatMap((group) => [
            <ListSubheader key={`${group.label}-heading`} disableSticky>
              {group.label}
            </ListSubheader>,
            ...group.presets.map((preset) => (
              <MenuItem
                key={preset}
                selected={selectedDateRangePreset === preset}
                onClick={() => handleDateRangePreset(preset)}
              >
                {PRESET_LABELS.get(preset)}
              </MenuItem>
            )),
          ])}
        </Menu>

        {activeFilterCount > 0 && (
          <Stack
            direction="row"
            flexWrap="wrap"
            gap={1}
            alignItems="center"
            sx={{
              flexBasis: { xs: "100%", md: "auto" },
              flexGrow: { xs: 0, md: 1 },
              justifyContent: { xs: "flex-start", md: "flex-end" },
              minWidth: 0,
            }}
            aria-label="Active report filters"
          >
            {Boolean(filters.startDate || filters.endDate) && (
              <Chip
                label={dateRangeChipLabel}
                size="small"
                onDelete={handleRemoveDateRange}
              />
            )}
            {filters.years.map((year) => (
              <Chip
                key={`year-${year}`}
                label={`Year: ${year}`}
                size="small"
                onDelete={() => handleRemoveYear(year)}
              />
            ))}
            {filters.categories.map((category) => (
              <Chip
                key={`category-${category}`}
                label={`Category: ${category}`}
                size="small"
                onDelete={() => handleRemoveCategory(category)}
              />
            ))}
            {filters.tags.map((tag) => (
              <Chip
                key={`tag-${tag}`}
                label={`Tag: ${tag}`}
                size="small"
                onDelete={() => handleRemoveTag(tag)}
              />
            ))}
            {filters.search && (
              <Chip
                label={`Search: ${filters.search}`}
                size="small"
                onDelete={handleRemoveSearch}
              />
            )}
            <Button
              size="small"
              onClick={handleReset}
              sx={{ textTransform: "none" }}
            >
              Clear all
            </Button>
          </Stack>
        )}
      </Box>

      {/* Advanced filters panel */}
      <Collapse in={expanded}>
        <Box
          id="report-advanced-filters"
          sx={{
            px: { xs: 2, sm: 2.5 },
            pb: 2,
            pt: 0.5,
            borderTop: (theme) => `1px solid ${theme.palette.divider}`,
          }}
        >
          <Stack spacing={2} sx={{ mt: 2 }}>
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
                  flexWrap: "wrap",
                  gap: 0.5,
                  "& .MuiToggleButtonGroup-grouped": {
                    borderRadius: 1,
                    borderColor: "divider",
                    px: 1.5,
                    py: 0.25,
                    textTransform: "none",
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

            {/* Date range row */}
            <Box display="flex" flexWrap="wrap" gap={2} alignItems="center">
              <DatePicker
                label="Start Date"
                value={startDate}
                onChange={(value) => {
                  setStartDate(value);
                  setSelectedYears([]);
                  setSelectedDateRangePreset("custom");
                }}
                slotProps={{ textField: { size: "small", sx: { width: 170 } } }}
              />
              <DatePicker
                label="End Date"
                value={endDate}
                onChange={(value) => {
                  setEndDate(value);
                  setSelectedYears([]);
                  setSelectedDateRangePreset("custom");
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
