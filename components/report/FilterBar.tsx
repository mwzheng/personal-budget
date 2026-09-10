// FilterBar is controlled by applied parent filters. Manually entered amount
// bounds remain local drafts until they have been idle long enough to validate.
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
import { AmountRangeFilter } from "@/components/report/AmountRangeFilter";
import {
  DEFAULT_REPORT_AMOUNT_RANGE,
  formatReportAmount,
  isSameReportAmountRange,
  parseReportAmountDraft,
  REPORT_AMOUNT_PRESETS,
  REPORT_AMOUNT_MAX,
  type ReportAmountInputErrors,
  type ReportAmountRange,
} from "@/lib/utils/reportAmount";

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
  { label: "Other", presets: ["all-time"] },
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
    if (preset.value === "all-time") continue;
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

function formatAmountFilterLabel(range: ReportAmountRange) {
  if (range.minAmount === 0)
    return `Amount: Up to ${formatReportAmount(range.maxAmount)}`;
  if (range.maxAmount === REPORT_AMOUNT_MAX)
    return `Amount: ${formatReportAmount(range.minAmount)}+`;
  return `Amount: ${formatReportAmount(range.minAmount)}–${formatReportAmount(range.maxAmount)}`;
}

function getAmountRangeMenuLabel(range: ReportAmountRange) {
  const preset = REPORT_AMOUNT_PRESETS.find((option) =>
    isSameReportAmountRange(option.range, range),
  );
  return `Amount: ${preset?.label ?? "Custom"}`;
}

export function FilterBar({ availableTags, filters, onChange }: Props) {
  const [startDate, setStartDate] = useState<Date | null>(() =>
    parseFilterDate(filters.startDate),
  );
  const [endDate, setEndDate] = useState<Date | null>(() =>
    parseFilterDate(filters.endDate),
  );
  const selectedDateRangePreset = getSelectedDateRangePreset(filters);
  const [minAmountInput, setMinAmountInput] = useState(() =>
    String(filters.minAmount),
  );
  const [maxAmountInput, setMaxAmountInput] = useState(() =>
    filters.maxAmount === REPORT_AMOUNT_MAX ? "" : String(filters.maxAmount),
  );
  const [amountErrors, setAmountErrors] = useState<ReportAmountInputErrors>({});
  const [expanded, setExpanded] = useState(false);
  const [dateRangeMenuAnchor, setDateRangeMenuAnchor] =
    useState<HTMLElement | null>(null);
  const [amountRangeMenuAnchor, setAmountRangeMenuAnchor] =
    useState<HTMLElement | null>(null);
  const [amountDebounceRequest, setAmountDebounceRequest] = useState<
    number | null
  >(null);
  const amountDebounceTimer = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const latestFilters = useRef(filters);
  const latestOnChange = useRef(onChange);
  const latestAmountDraft = useRef({ minAmountInput, maxAmountInput });
  latestFilters.current = filters;
  latestOnChange.current = onChange;
  latestAmountDraft.current = { minAmountInput, maxAmountInput };

  function cancelAmountDebounce() {
    if (amountDebounceTimer.current) {
      clearTimeout(amountDebounceTimer.current);
      amountDebounceTimer.current = null;
    }
    setAmountDebounceRequest(null);
  }

  // Only changed applied fields replace their drafts. In particular, immediate
  // search changes must leave unfinished advanced edits alone, even when the
  // parent recreates array values while persisting filters.
  const previousFilters = useRef(filters);
  useEffect(() => {
    const previous = previousFilters.current;
    if (previous.startDate !== filters.startDate) {
      setStartDate(parseFilterDate(filters.startDate));
    }
    if (previous.endDate !== filters.endDate) {
      setEndDate(parseFilterDate(filters.endDate));
    }
    if (previous.minAmount !== filters.minAmount) {
      setMinAmountInput(String(filters.minAmount));
    }
    if (previous.maxAmount !== filters.maxAmount) {
      setMaxAmountInput(
        filters.maxAmount === REPORT_AMOUNT_MAX
          ? ""
          : String(filters.maxAmount),
      );
    }
    if (
      previous.minAmount !== filters.minAmount ||
      previous.maxAmount !== filters.maxAmount
    ) {
      cancelAmountDebounce();
      setAmountErrors({});
    }
    previousFilters.current = filters;
  }, [filters]);

  useEffect(() => {
    if (amountDebounceRequest === null) return;

    amountDebounceTimer.current = setTimeout(() => {
      amountDebounceTimer.current = null;
      const result = parseReportAmountDraft(
        latestAmountDraft.current.minAmountInput,
        latestAmountDraft.current.maxAmountInput,
      );
      if (!result.range) {
        setAmountErrors(result.errors);
        return;
      }

      setAmountErrors({});
      const currentFilters = latestFilters.current;
      if (!isSameReportAmountRange(result.range, currentFilters)) {
        latestOnChange.current({ ...currentFilters, ...result.range });
      }
    }, 500);

    return () => {
      if (amountDebounceTimer.current) {
        clearTimeout(amountDebounceTimer.current);
        amountDebounceTimer.current = null;
      }
    };
  }, [amountDebounceRequest]);

  // Count individual applied filters for the More filters badge.
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.startDate || filters.endDate) count += 1;
    count += filters.years.length;
    count += filters.categories.length;
    count += filters.tags.length;
    if (filters.search) count += 1;
    if (!isSameReportAmountRange(filters, DEFAULT_REPORT_AMOUNT_RANGE))
      count += 1;
    return count;
  }, [filters]);

  // Date range and search are already represented by visible toolbar controls.
  // Chips are reserved for filters that otherwise remain hidden while collapsed.
  const hasAdvancedAppliedFilters =
    filters.years.length > 0 ||
    filters.categories.length > 0 ||
    filters.tags.length > 0 ||
    !isSameReportAmountRange(filters, DEFAULT_REPORT_AMOUNT_RANGE);
  const hasClearableFilters =
    activeFilterCount > 0 ||
    startDate !== null ||
    endDate !== null ||
    minAmountInput !== String(DEFAULT_REPORT_AMOUNT_RANGE.minAmount) ||
    maxAmountInput !== "";
  function applyFilters(
    years: string[],
    sd: Date | null,
    ed: Date | null,
    categories: TransactionCategoryType[],
    tags: string[],
    q: string,
    amountRange: ReportAmountRange = filters,
  ) {
    onChange({
      years,
      startDate: sd ? format(sd, "yyyy-MM-dd") : null,
      endDate: ed ? format(ed, "yyyy-MM-dd") : null,
      categories,
      tags,
      search: q,
      minAmount: amountRange.minAmount,
      maxAmount: amountRange.maxAmount,
    });
  }

  function handleDateRangePreset(preset: ReportDateRangePreset) {
    setDateRangeMenuAnchor(null);

    const range = getReportDateRangePreset(preset);
    const nextStartDate = parseFilterDate(range.startDate);
    const nextEndDate = parseFilterDate(range.endDate);

    setStartDate(nextStartDate);
    setEndDate(nextEndDate);
    applyFilters(
      [],
      nextStartDate,
      nextEndDate,
      filters.categories,
      filters.tags,
      filters.search,
    );
  }

  function handleStartDateChange(value: Date | null) {
    setStartDate(value);

    if (value && Number.isNaN(value.getTime())) {
      return;
    }

    const nextStartDate = value ? format(value, "yyyy-MM-dd") : null;
    if (nextStartDate && filters.endDate && nextStartDate > filters.endDate) {
      return;
    }

    const nextFilters: FilterParams = {
      ...filters,
      years: [],
      startDate: nextStartDate,
    };
    onChange(nextFilters);
  }

  function handleEndDateChange(value: Date | null) {
    setEndDate(value);

    if (value && Number.isNaN(value.getTime())) {
      return;
    }

    const nextEndDate = value ? format(value, "yyyy-MM-dd") : null;
    if (nextEndDate && filters.startDate && nextEndDate < filters.startDate) {
      return;
    }

    const nextFilters: FilterParams = {
      ...filters,
      years: [],
      endDate: nextEndDate,
    };
    onChange(nextFilters);
  }

  function handleAmountPreset(range: ReportAmountRange) {
    cancelAmountDebounce();
    setAmountRangeMenuAnchor(null);
    setMinAmountInput(String(range.minAmount));
    setMaxAmountInput(
      range.maxAmount === REPORT_AMOUNT_MAX ? "" : String(range.maxAmount),
    );
    setAmountErrors({});
    applyFilters(
      filters.years,
      parseFilterDate(filters.startDate),
      parseFilterDate(filters.endDate),
      filters.categories,
      filters.tags,
      filters.search,
      range,
    );
  }

  function handleMinAmountInputChange(value: string) {
    setMinAmountInput(value);
    setAmountErrors({});
    setAmountDebounceRequest((request) => (request ?? 0) + 1);
  }

  function handleMaxAmountInputChange(value: string) {
    setMaxAmountInput(value);
    setAmountErrors({});
    setAmountDebounceRequest((request) => (request ?? 0) + 1);
  }

  function handleRemoveYear(year: string) {
    const nextYears = filters.years.filter(
      (selectedYear) => selectedYear !== year,
    );
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
    handleCategoriesChange(nextCategories);
  }

  function handleCategoriesChange(nextCategories: TransactionCategoryType[]) {
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
    handleTagsChange(nextTags);
  }

  function handleTagsChange(nextTags: string[]) {
    applyFilters(
      filters.years,
      parseFilterDate(filters.startDate),
      parseFilterDate(filters.endDate),
      filters.categories,
      nextTags,
      filters.search,
    );
  }

  function handleRemoveAmount() {
    cancelAmountDebounce();
    setMinAmountInput(String(DEFAULT_REPORT_AMOUNT_RANGE.minAmount));
    setMaxAmountInput("");
    setAmountErrors({});
    applyFilters(
      filters.years,
      parseFilterDate(filters.startDate),
      parseFilterDate(filters.endDate),
      filters.categories,
      filters.tags,
      filters.search,
      DEFAULT_REPORT_AMOUNT_RANGE,
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

  function handleClearFilters() {
    cancelAmountDebounce();
    setStartDate(null);
    setEndDate(null);
    setMinAmountInput(String(DEFAULT_REPORT_AMOUNT_RANGE.minAmount));
    setMaxAmountInput("");
    setAmountErrors({});
    onChange({
      years: [],
      startDate: null,
      endDate: null,
      categories: [],
      tags: [],
      search: "",
      ...DEFAULT_REPORT_AMOUNT_RANGE,
    });
  }

  return (
    <Paper sx={{ mb: 3, minWidth: 0, maxWidth: "100%" }}>
      {/* Toolbar */}
      <Box
        data-testid="report-filter-toolbar"
        sx={{
          display: "flex",
          flexWrap: "wrap",
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
          sx={{
            flex: { xs: "1 1 100%", sm: "1 1 260px" },
            minWidth: 0,
            order: { xs: -1, sm: 0 },
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="action" />
              </InputAdornment>
            ),
            endAdornment: filters.search ? (
              <InputAdornment position="end">
                <IconButton
                  aria-label="Clear Search"
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
            maxWidth: "100%",
            minWidth: 0,
          }}
        >
          <Button
            variant="outlined"
            size="small"
            onClick={(event) => setDateRangeMenuAnchor(event.currentTarget)}
            aria-label="Choose Date"
            aria-haspopup="menu"
            aria-expanded={Boolean(dateRangeMenuAnchor)}
            aria-controls={
              dateRangeMenuAnchor ? "report-date-range-menu" : undefined
            }
            sx={{ minHeight: 40, textTransform: "none" }}
          >
            Date
            {selectedDateRangePreset
              ? `: ${selectedDateRangePreset === "custom" ? "Custom" : PRESET_LABELS.get(selectedDateRangePreset)}`
              : ""}
          </Button>
          <Button
            variant="outlined"
            size="small"
            onClick={(event) => setAmountRangeMenuAnchor(event.currentTarget)}
            aria-label="Choose Amount"
            aria-haspopup="menu"
            aria-expanded={Boolean(amountRangeMenuAnchor)}
            aria-controls={
              amountRangeMenuAnchor ? "report-amount-range-menu" : undefined
            }
            sx={{ minHeight: 40, textTransform: "none" }}
          >
            {getAmountRangeMenuLabel(filters)}
          </Button>
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
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
              aria-label={expanded ? "Hide More Filters" : "Show More Filters"}
              sx={{ minHeight: 40, textTransform: "none" }}
            >
              More Filters
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
          MenuListProps={{ "aria-label": "Report Date Options" }}
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
        <Menu
          id="report-amount-range-menu"
          anchorEl={amountRangeMenuAnchor}
          open={Boolean(amountRangeMenuAnchor)}
          onClose={() => setAmountRangeMenuAnchor(null)}
          MenuListProps={{ "aria-label": "Report Amount Options" }}
        >
          {REPORT_AMOUNT_PRESETS.map((preset) => (
            <MenuItem
              key={preset.value}
              selected={isSameReportAmountRange(preset.range, filters)}
              onClick={() => handleAmountPreset(preset.range)}
            >
              {preset.label}
            </MenuItem>
          ))}
        </Menu>

        {hasAdvancedAppliedFilters && (
          <Stack
            direction="row"
            flexWrap="wrap"
            gap={1}
            alignItems="center"
            sx={{
              flexBasis: "100%",
              width: "100%",
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
            aria-label="Active Report Filters"
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
            {!isSameReportAmountRange(filters, DEFAULT_REPORT_AMOUNT_RANGE) && (
              <Chip
                key="amount"
                label={formatAmountFilterLabel(filters)}
                size="small"
                onDelete={handleRemoveAmount}
              />
            )}
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
                lg: "repeat(10, minmax(0, 1fr))",
              },
              gap: 1.25,
              alignItems: "center",
              minWidth: 0,
            }}
          >
            <Box sx={{ gridColumn: { lg: "span 2" }, minWidth: 0 }}>
              <DatePicker
                label="Start Date"
                value={startDate}
                onChange={handleStartDateChange}
                slotProps={{
                  textField: { size: "small", sx: { width: "100%" } },
                }}
                sx={{ width: "100%" }}
              />
            </Box>
            <Box sx={{ gridColumn: { lg: "span 2" }, minWidth: 0 }}>
              <DatePicker
                label="End Date"
                value={endDate}
                onChange={handleEndDateChange}
                slotProps={{
                  textField: { size: "small", sx: { width: "100%" } },
                }}
                sx={{ width: "100%" }}
              />
            </Box>
            <Box
              data-testid="report-amount-actions"
              sx={{
                gridColumn: { xs: "1 / -1", lg: "span 6" },
                display: { xs: "grid", lg: "flex" },
                gridTemplateColumns: {
                  xs: "minmax(0, 1fr)",
                },
                gap: 1.25,
                alignItems: { xs: "start", lg: "center" },
                minWidth: 0,
              }}
            >
              <Box
                sx={{
                  gridColumn: { sm: "1 / -1" },
                  flex: { lg: 1 },
                  minWidth: 0,
                }}
              >
                <AmountRangeFilter
                  minAmountInput={minAmountInput}
                  maxAmountInput={maxAmountInput}
                  errors={amountErrors}
                  onMinAmountChange={handleMinAmountInputChange}
                  onMaxAmountChange={handleMaxAmountInputChange}
                />
              </Box>
            </Box>
            <Autocomplete
              multiple
              size="small"
              options={TRANSACTION_CATEGORY_OPTIONS}
              value={filters.categories}
              onChange={(_event, value) =>
                handleCategoriesChange(value as TransactionCategoryType[])
              }
              renderInput={(params) => (
                <TextField {...params} label="Category" />
              )}
              sx={{ gridColumn: { lg: "span 5" }, minWidth: 0, width: "100%" }}
              limitTags={2}
            />
            <Autocomplete
              multiple
              size="small"
              options={availableTags}
              value={filters.tags}
              onChange={(_event, value) => handleTagsChange(value)}
              renderInput={(params) => <TextField {...params} label="Tags" />}
              sx={{ gridColumn: { lg: "span 5" }, minWidth: 0, width: "100%" }}
              limitTags={2}
            />
          </Box>
        </Box>
      </Collapse>
    </Paper>
  );
}
