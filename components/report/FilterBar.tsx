// FilterBar is controlled by applied parent filters while the advanced panel keeps
// a local draft until Apply. Date presets are intentionally immediate because
// they are common report-navigation controls.
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
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import SearchIcon from "@mui/icons-material/Search";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Autocomplete from "@mui/material/Autocomplete";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import FilterListIcon from "@mui/icons-material/FilterList";
import ClearIcon from "@mui/icons-material/Close";
import { format, parseISO } from "date-fns";
import { useEffect, useMemo, useRef, useState } from "react";

import { FilterParams, TransactionCategoryType } from "@/lib/types/types";
import {
  getReportDateRangePreset,
  ReportDateRangePreset,
} from "@/lib/utils/aggregations";
import { TRANSACTION_CATEGORY_OPTIONS } from "@/lib/utils/transaction-categories";

interface Props {
  availableTags: string[];
  filters: FilterParams;
  onChange: (filters: FilterParams) => void;
}

function parseFilterDate(value: string | null): Date | null {
  if (!value) return null;
  const parsed = parseISO(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export const DATE_RANGE_PRESETS: Array<{
  label: string;
  value: ReportDateRangePreset;
}> = [
  { label: "This Month", value: "this-month" },
  { label: "Last Month", value: "last-month" },
  { label: "This Quarter", value: "this-quarter" },
  { label: "Last Quarter", value: "last-quarter" },
  { label: "This Year", value: "this-year" },
  { label: "Last Year", value: "last-year" },
  { label: "Last 90 Days", value: "last-90-days" },
  { label: "All Time", value: "all-time" },
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

function sameStringValues(left: readonly string[], right: readonly string[]) {
  return (
    left.length === right.length &&
    left.every((value, index) => value === right[index])
  );
}

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

export function FilterBar({ availableTags, filters, onChange }: Props) {
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

  // Only changed applied fields replace their drafts. In particular, immediate
  // search changes must leave unfinished advanced edits alone, even when the
  // parent recreates array values while persisting filters.
  const previousFilters = useRef(filters);
  useEffect(() => {
    const previous = previousFilters.current;
    const yearsChanged = !sameStringValues(previous.years, filters.years);
    if (previous.startDate !== filters.startDate) {
      setStartDate(parseFilterDate(filters.startDate));
    }
    if (previous.endDate !== filters.endDate) {
      setEndDate(parseFilterDate(filters.endDate));
    }
    if (!sameStringValues(previous.categories, filters.categories)) {
      setSelectedCategories(filters.categories);
    }
    if (!sameStringValues(previous.tags, filters.tags)) {
      setSelectedTags(filters.tags);
    }
    if (yearsChanged) setSelectedYears(filters.years);
    if (
      yearsChanged ||
      previous.startDate !== filters.startDate ||
      previous.endDate !== filters.endDate
    ) {
      setSelectedDateRangePreset(getSelectedDateRangePreset(filters));
    }
    previousFilters.current = filters;
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

  // Date range and search are already represented by visible toolbar controls.
  // Chips are reserved for filters that otherwise remain hidden while collapsed.
  const hasAdvancedAppliedFilters =
    filters.years.length > 0 ||
    filters.categories.length > 0 ||
    filters.tags.length > 0;
  const hasClearableFilters =
    activeFilterCount > 0 ||
    startDate !== null ||
    endDate !== null ||
    selectedYears.length > 0 ||
    selectedCategories.length > 0 ||
    selectedTags.length > 0;

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
      filters.search,
    );
  }

  function handleClearFilters() {
    setStartDate(null);
    setEndDate(null);
    setSelectedCategories([]);
    setSelectedTags([]);
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
    <Paper sx={{ mb: 3, minWidth: 0, maxWidth: "100%" }}>
      {/* Toolbar */}
      <Box
        data-testid="report-filter-toolbar"
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "minmax(0, 1fr)",
            sm: "minmax(0, 1fr) auto",
          },
          alignItems: "center",
          gap: 1.25,
          p: { xs: 2, sm: 2.5 },
          minWidth: 0,
        }}
      >
        <TextField
          label="Search Transactions"
          placeholder="Name, note, or tag"
          size="small"
          value={filters.search}
          onChange={(event) =>
            onChange({ ...filters, search: event.target.value })
          }
          sx={{ gridColumn: 1, minWidth: 0, width: "100%" }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="action" />
              </InputAdornment>
            ),
            endAdornment: filters.search ? (
              <InputAdornment position="end">
                <IconButton
                  aria-label="Clear search"
                  size="small"
                  onClick={handleRemoveSearch}
                >
                  <ClearIcon fontSize="small" />
                </IconButton>
              </InputAdornment>
            ) : undefined,
          }}
        />
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.25,
            flexWrap: "wrap",
            gridColumn: { xs: 1, sm: 2 },
            maxWidth: "100%",
            minWidth: 0,
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
            sx={{ minHeight: 40, textTransform: "none" }}
          >
            Date Range
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
              sx={{ minHeight: 40, textTransform: "none" }}
            >
              More filters
            </Button>
          </Badge>
          <Button
            size="small"
            variant="outlined"
            startIcon={<ClearIcon />}
            onClick={handleClearFilters}
            disabled={!hasClearableFilters}
            sx={{ minHeight: 40, textTransform: "none" }}
          >
            Clear Filters
          </Button>
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

        {hasAdvancedAppliedFilters && (
          <Stack
            direction="row"
            flexWrap="wrap"
            gap={1}
            alignItems="center"
            sx={{
              gridColumn: "1 / -1",
              maxWidth: "100%",
              minWidth: 0,
              "& .MuiChip-root": {
                maxWidth: "100%",
              },
              "& .MuiChip-label": {
                overflow: "hidden",
                textOverflow: "ellipsis",
              },
            }}
            aria-label="Active report filters"
          >
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
          </Stack>
        )}
      </Box>

      {/* Advanced filters panel */}
      <Collapse in={expanded}>
        <Box
          id="report-advanced-filters"
          data-testid="report-advanced-filter-panel"
          sx={{
            p: { xs: 2, sm: 2.5 },
            borderTop: (theme) => `1px solid ${theme.palette.divider}`,
          }}
        >
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "minmax(0, 1fr)",
                sm: "repeat(2, minmax(0, 1fr))",
                md: "170px 170px minmax(0, 1fr) minmax(0, 1fr)",
                lg: "170px 170px minmax(180px, 1fr) minmax(180px, 1fr) auto",
              },
              gap: 1.25,
              alignItems: "center",
              minWidth: 0,
            }}
          >
            <DatePicker
              label="Start Date"
              value={startDate}
              onChange={(value) => {
                setStartDate(value);
                setSelectedYears([]);
                setSelectedDateRangePreset("custom");
              }}
              slotProps={{
                textField: { size: "small", sx: { width: "100%" } },
              }}
            />
            <DatePicker
              label="End Date"
              value={endDate}
              onChange={(value) => {
                setEndDate(value);
                setSelectedYears([]);
                setSelectedDateRangePreset("custom");
              }}
              slotProps={{
                textField: { size: "small", sx: { width: "100%" } },
              }}
            />
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
              sx={{ minWidth: 0, width: "100%" }}
              limitTags={2}
            />
            <Autocomplete
              multiple
              size="small"
              options={availableTags}
              value={selectedTags}
              onChange={(_event, value) => setSelectedTags(value)}
              renderInput={(params) => <TextField {...params} label="Tags" />}
              sx={{ minWidth: 0, width: "100%" }}
              limitTags={2}
            />
            <Box
              display="flex"
              gap={1}
              sx={{
                justifyContent: {
                  xs: "stretch",
                  sm: "flex-end",
                  lg: "flex-start",
                },
                gridColumn: { xs: "auto", sm: "1 / -1", lg: "auto" },
                whiteSpace: "nowrap",
              }}
            >
              <Button
                variant="contained"
                size="small"
                onClick={handleApply}
                sx={{ minHeight: 40, flex: { xs: 1, sm: "initial" } }}
              >
                Apply
              </Button>
            </Box>
          </Box>
        </Box>
      </Collapse>
    </Paper>
  );
}
