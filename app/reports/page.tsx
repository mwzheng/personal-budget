"use client";

import AddIcon from "@mui/icons-material/Add";
import AssessmentOutlinedIcon from "@mui/icons-material/AssessmentOutlined";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import FileUploadOutlinedIcon from "@mui/icons-material/FileUploadOutlined";
import ViewListIcon from "@mui/icons-material/ViewList";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Dialog from "@mui/material/Dialog";
import Fab from "@mui/material/Fab";
import ListItemText from "@mui/material/ListItemText";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { ChartLoadingState } from "@/components/charts/ChartLoadingState";
import { FilterBar } from "@/components/report/FilterBar";
import { YearlyReport } from "@/components/report/YearlyReport";
import PageHeader from "@/components/ui/PageHeader";
import SectionCard from "@/components/ui/SectionCard";
import { TransactionCalendar } from "@/components/transactions/TransactionCalendar";
import { TransactionDetailDialog } from "@/components/transactions/TransactionDetailDialog";
import { ImportCsvDialog } from "@/components/transactions/ImportCsvDialog";
import { TransactionForm } from "@/components/transactions/TransactionForm";
import { TransactionsTable } from "@/components/transactions/TransactionsTable";
import { apiFetch } from "@/lib/api/apiFetch";
import { isAuthenticated } from "@/lib/auth/cognitoClient";
import {
  filterTransactions,
  aggregateTransactions,
  getAllTags,
  getAvailableReportYears,
  buildYearlyReport,
} from "@/lib/utils/aggregations";
import {
  getLastSelectedReportFilters,
  getLastSelectedReportTransactionsView,
  getLastSelectedReportYears,
  setLastSelectedReportFilters,
  setLastSelectedReportTransactionsView,
} from "@/lib/utils/storage";
import { Transaction } from "@/lib/types/types";
import { formatCurrency } from "@/lib/utils/format";

import SpendingBreakdownLoadingState from "@/components/report/SpendingBreakdownLoadingState";
import EmptyState from "@/components/report/EmptyState";
import StatCard from "@/components/report/StatCard";
import {
  EMPTY_AGGREGATES,
  EMPTY_FILTERS,
  PAGE_TITLE_ID,
  PAGE_DESCRIPTION_ID,
  TransactionsViewMode,
  buildQuickTagFilters,
  buildComparablePeriodFilters,
  buildStatTrend,
  initializeReportFilters,
} from "@/lib/utils/reportUtils";
import { SpendingPieChart } from "@/components/charts/SpendingPieChart";
import { SpendingBarChart } from "@/components/charts/SpendingBarChart";
import { TagBarChart } from "@/components/charts/TagBarChart";
import { MonthComparisonModal } from "@/components/charts/MonthComparisonModal";
import { YearComparisonModal } from "@/components/charts/YearComparisonModal";

interface TransactionsApiResponse {
  ok?: boolean;
  error?: string;
  transactions?: Transaction[];
}

const ReportsPageContent = () => {
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [transactionsLoaded, setTransactionsLoaded] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [filtersInitialized, setFiltersInitialized] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Transaction | undefined>(
    undefined,
  );
  const [duplicateTarget, setDuplicateTarget] = useState<
    Transaction | undefined
  >(undefined);
  const [newTransactionDate, setNewTransactionDate] = useState<string | null>(
    null,
  );
  const [transactionsView, setTransactionsView] =
    useState<TransactionsViewMode>("table");
  const [detailTarget, setDetailTarget] = useState<Transaction | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [compareOpen, setCompareOpen] = useState(false);
  const [yearCompareOpen, setYearCompareOpen] = useState(false);
  const [yearlyReportOpen, setYearlyReportOpen] = useState(false);
  const [exploreMenuAnchor, setExploreMenuAnchor] =
    useState<HTMLElement | null>(null);
  const [dataMenuAnchor, setDataMenuAnchor] = useState<HTMLElement | null>(
    null,
  );
  const [selectedReportYear, setSelectedReportYear] = useState(() =>
    new Date().getFullYear(),
  );
  const router = useRouter();

  const applyTransactions = (transactions: Transaction[]) => {
    setAllTransactions(transactions);
  };

  const loadTransactions = async () => {
    setLoading(true);
    setErrorMessage(null);

    try {
      const res = await apiFetch("/api/transactions");

      if (res.status === 401 || res.status === 403) {
        router.replace("/auth/login");
        return;
      }

      const data = (await res.json()) as TransactionsApiResponse;

      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Failed to load transactions");
      }

      applyTransactions(data.transactions ?? []);
      setTransactionsLoaded(true);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to load transactions",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const disableAuth = process.env.NEXT_PUBLIC_DISABLE_AUTH === "true";

    if (!disableAuth && !isAuthenticated()) {
      router.replace("/auth/login");
      return;
    }

    void loadTransactions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  useEffect(() => {
    setTransactionsView(getLastSelectedReportTransactionsView());
  }, []);

  useEffect(() => {
    if (!transactionsLoaded || loading || filtersInitialized) return;

    setFilters(
      initializeReportFilters(
        allTransactions,
        getLastSelectedReportFilters(),
        getLastSelectedReportYears(),
      ),
    );
    setFiltersInitialized(true);
  }, [allTransactions, filtersInitialized, loading, transactionsLoaded]);

  useEffect(() => {
    if (!filtersInitialized) return;
    setLastSelectedReportFilters(filters);
  }, [filters, filtersInitialized]);

  const handleSaveTransaction = async (t: Transaction) => {
    setErrorMessage(null);

    try {
      const res = await apiFetch("/api/transactions", {
        method: editTarget ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          editTarget ? { ...t, originalDate: editTarget.date } : t,
        ),
      });

      const data = (await res.json()) as { ok?: boolean; error?: string };

      if (res.status === 401 || res.status === 403) {
        router.replace("/auth/login");
        return;
      }

      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Failed to save transaction");
      }

      await loadTransactions();
      setFormOpen(false);
      setEditTarget(undefined);
      setDuplicateTarget(undefined);
      setNewTransactionDate(null);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to save transaction",
      );
    }
  };

  const handleEditTransaction = (t: Transaction) => {
    setNewTransactionDate(null);
    setDuplicateTarget(undefined);
    setEditTarget(t);
    setFormOpen(true);
  };

  const handleDuplicateTransaction = (t: Transaction) => {
    setDetailTarget(null);
    setNewTransactionDate(null);
    setEditTarget(undefined);
    setDuplicateTarget(t);
    setFormOpen(true);
  };

  const handleAddTransaction = (date?: string) => {
    setEditTarget(undefined);
    setDuplicateTarget(undefined);
    setNewTransactionDate(date ?? null);
    setFormOpen(true);
  };

  const handleDeleteTransaction = async (id: string) => {
    const transaction = allTransactions.find((item) => item.id === id);
    if (!transaction) return false;

    setErrorMessage(null);

    try {
      const res = await apiFetch("/api/transactions", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, date: transaction.date }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };

      if (res.status === 401 || res.status === 403) {
        router.replace("/auth/login");
        return false;
      }

      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Failed to delete transaction");
      }

      await loadTransactions();
      return true;
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to delete transaction",
      );
      return false;
    }
  };

  const handleFormClose = () => {
    setFormOpen(false);
    setEditTarget(undefined);
    setDuplicateTarget(undefined);
    setNewTransactionDate(null);
  };

  const handleExport = async () => {
    setErrorMessage(null);

    try {
      const params = new URLSearchParams();
      if (filters.years.length > 0)
        params.set("years", filters.years.join(","));
      if (filters.startDate) params.set("startDate", filters.startDate);
      if (filters.endDate) params.set("endDate", filters.endDate);
      if (filters.categories.length > 0)
        params.set("categories", filters.categories.join(","));
      if (filters.tags.length > 0) params.set("tags", filters.tags.join(","));
      if (filters.search) params.set("search", filters.search);

      const query = params.toString();
      const res = await apiFetch(
        `/api/reports/export${query ? `?${query}` : ""}`,
      );

      if (res.status === 401 || res.status === 403) {
        router.replace("/auth/login");
        return;
      }

      if (!res.ok) {
        throw new Error("Failed to export transactions");
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "transactions_export.csv";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Failed to export transactions",
      );
    }
  };

  const handleQuickTagFilter = (tag: string) => {
    setFilters((currentFilters) => buildQuickTagFilters(currentFilters, tag));
  };

  const availableYears = useMemo(
    () => getAvailableReportYears(allTransactions),
    [allTransactions],
  );

  const availableTags = useMemo(
    () => getAllTags(allTransactions),
    [allTransactions],
  );

  const currentYear = new Date().getFullYear();

  useEffect(() => {
    if (!transactionsLoaded) return;

    setSelectedReportYear(
      availableYears.includes(String(currentYear))
        ? currentYear
        : Number(availableYears[0] ?? currentYear),
    );
  }, [availableYears, currentYear, transactionsLoaded]);

  const yearlyReport = useMemo(
    () => buildYearlyReport(allTransactions, selectedReportYear),
    [allTransactions, selectedReportYear],
  );

  const filtered = useMemo(
    () => filterTransactions(allTransactions, filters),
    [allTransactions, filters],
  );

  const agg = useMemo(
    () =>
      filtered.length > 0 ? aggregateTransactions(filtered) : EMPTY_AGGREGATES,
    [filtered],
  );

  const comparableFilters = useMemo(
    () => buildComparablePeriodFilters(filters),
    [filters],
  );

  const comparableTransactions = useMemo(
    () =>
      comparableFilters
        ? filterTransactions(allTransactions, comparableFilters)
        : [],
    [allTransactions, comparableFilters],
  );

  const comparableAgg = useMemo(
    () =>
      comparableTransactions.length > 0
        ? aggregateTransactions(comparableTransactions)
        : null,
    [comparableTransactions],
  );

  const isEmpty = !loading && allTransactions.length === 0;

  return (
    <Container
      component="main"
      maxWidth="xl"
      aria-labelledby={PAGE_TITLE_ID}
      aria-describedby={PAGE_DESCRIPTION_ID}
      className="reports-page"
      sx={{ py: { xs: 3, md: 4 } }}
    >
      <PageHeader
        title="Reports"
        description="Track spending, compare income, and manage transactions."
        headingId={PAGE_TITLE_ID}
        descriptionId={PAGE_DESCRIPTION_ID}
        sx={{ mb: 3 }}
        action={
          !isEmpty ? (
            <Box sx={{ width: { xs: "100%", sm: "auto" } }}>
              <Stack direction={{ xs: "column", sm: "row" }} gap={1}>
                <Button
                  id="reports-explore-menu-button"
                  variant="outlined"
                  size="small"
                  startIcon={<AssessmentOutlinedIcon />}
                  endIcon={<ExpandMoreIcon />}
                  aria-haspopup="menu"
                  aria-controls={
                    exploreMenuAnchor ? "reports-explore-menu" : undefined
                  }
                  aria-expanded={exploreMenuAnchor ? "true" : undefined}
                  onClick={(event) => setExploreMenuAnchor(event.currentTarget)}
                  sx={{
                    justifyContent: "flex-start",
                    width: { xs: "100%", sm: "auto" },
                  }}
                >
                  Explore reports
                </Button>
                <Button
                  id="reports-data-menu-button"
                  variant="outlined"
                  size="small"
                  startIcon={<FileUploadOutlinedIcon />}
                  endIcon={<ExpandMoreIcon />}
                  aria-haspopup="menu"
                  aria-controls={
                    dataMenuAnchor ? "reports-data-menu" : undefined
                  }
                  aria-expanded={dataMenuAnchor ? "true" : undefined}
                  onClick={(event) => setDataMenuAnchor(event.currentTarget)}
                  sx={{
                    justifyContent: "flex-start",
                    width: { xs: "100%", sm: "auto" },
                  }}
                >
                  Data
                </Button>

                <Menu
                  id="reports-explore-menu"
                  anchorEl={exploreMenuAnchor}
                  open={Boolean(exploreMenuAnchor)}
                  onClose={() => setExploreMenuAnchor(null)}
                  MenuListProps={{
                    "aria-labelledby": "reports-explore-menu-button",
                  }}
                >
                  <MenuItem
                    onClick={() => {
                      setExploreMenuAnchor(null);
                      setYearlyReportOpen(true);
                    }}
                  >
                    <ListItemText
                      primary="Yearly report"
                      secondary="View your yearly spending overview"
                    />
                  </MenuItem>
                  <MenuItem
                    onClick={() => {
                      setExploreMenuAnchor(null);
                      setCompareOpen(true);
                    }}
                  >
                    <ListItemText
                      primary="Compare months"
                      secondary="Compare spending across two months"
                    />
                  </MenuItem>
                  <MenuItem
                    onClick={() => {
                      setExploreMenuAnchor(null);
                      setYearCompareOpen(true);
                    }}
                  >
                    <ListItemText
                      primary="Compare years"
                      secondary="Compare like-for-like yearly spending"
                    />
                  </MenuItem>
                </Menu>

                <Menu
                  id="reports-data-menu"
                  anchorEl={dataMenuAnchor}
                  open={Boolean(dataMenuAnchor)}
                  onClose={() => setDataMenuAnchor(null)}
                  MenuListProps={{
                    "aria-labelledby": "reports-data-menu-button",
                  }}
                >
                  <MenuItem
                    onClick={() => {
                      setDataMenuAnchor(null);
                      setImportOpen(true);
                    }}
                  >
                    <ListItemText
                      primary="Import CSV"
                      secondary="Add transactions from a CSV file"
                    />
                  </MenuItem>
                  <MenuItem
                    disabled={filtered.length === 0}
                    onClick={() => {
                      setDataMenuAnchor(null);
                      void handleExport();
                    }}
                  >
                    <ListItemText
                      primary="Export filtered data"
                      secondary="Download the current filtered transactions"
                    />
                  </MenuItem>
                </Menu>
              </Stack>
            </Box>
          ) : undefined
        }
      />
      {isEmpty ? (
        <Box className="report-page__non-yearly">
          {errorMessage && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {errorMessage}
            </Alert>
          )}
          <EmptyState
            onAddClick={() => handleAddTransaction()}
            onImportClick={() => setImportOpen(true)}
          />
        </Box>
      ) : (
        <>
          <Box className="report-page__non-yearly">
            {errorMessage && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {errorMessage}
              </Alert>
            )}
            <Box
              role="toolbar"
              aria-label="Report actions"
              sx={{ display: { xs: "flex", md: "none" }, mb: 2 }}
            >
              <Button
                fullWidth
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => handleAddTransaction()}
              >
                Add Transaction
              </Button>
            </Box>
            {loading ? (
              <Skeleton
                variant="rounded"
                height={48}
                sx={{ mb: 3, borderRadius: 1 }}
              />
            ) : (
              <FilterBar
                availableTags={availableTags}
                availableYears={availableYears}
                filters={filters}
                onChange={setFilters}
              />
            )}
            {loading ? (
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "repeat(2, 1fr)",
                    sm: "repeat(3, 1fr)",
                    md: "repeat(5, 1fr)",
                  },
                  gap: 1.5,
                  mb: 3,
                }}
              >
                {Array.from({ length: 5 }, (_, i) => (
                  <Skeleton
                    key={`stat-skeleton-${i}`}
                    variant="rounded"
                    height={72}
                    sx={{ borderRadius: 1 }}
                  />
                ))}
              </Box>
            ) : (
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "repeat(2, 1fr)",
                    sm: "repeat(3, 1fr)",
                    md: "repeat(5, 1fr)",
                  },
                  gap: 1.5,
                  mb: 3,
                }}
              >
                {(
                  [
                    {
                      label: "Income",
                      value: formatCurrency(agg.incomeAmount),
                      color: "#26a69a",
                      trend: comparableAgg
                        ? buildStatTrend(
                            agg.incomeAmount,
                            comparableAgg.incomeAmount,
                            true,
                          )
                        : null,
                    },
                    {
                      label: "Spending",
                      value: formatCurrency(agg.spendingAmount),
                      color: "text.primary",
                      trend: comparableAgg
                        ? buildStatTrend(
                            agg.spendingAmount,
                            comparableAgg.spendingAmount,
                            false,
                          )
                        : null,
                    },
                    {
                      label: "Needs",
                      value: formatCurrency(agg.totalByCategoryType.Need),
                      color: "#B91C1C",
                      trend: comparableAgg
                        ? buildStatTrend(
                            agg.totalByCategoryType.Need,
                            comparableAgg.totalByCategoryType.Need,
                            false,
                          )
                        : null,
                    },
                    {
                      label: "Wants",
                      value: formatCurrency(agg.totalByCategoryType.Want),
                      color: "#42a5f5",
                      trend: comparableAgg
                        ? buildStatTrend(
                            agg.totalByCategoryType.Want,
                            comparableAgg.totalByCategoryType.Want,
                            false,
                          )
                        : null,
                    },
                    {
                      label: "Savings",
                      value: formatCurrency(agg.totalByCategoryType.Saving),
                      color: "#15803D",
                      trend: comparableAgg
                        ? buildStatTrend(
                            agg.totalByCategoryType.Saving,
                            comparableAgg.totalByCategoryType.Saving,
                            true,
                          )
                        : null,
                    },
                  ] as const
                ).map((s) => (
                  <StatCard key={s.label} {...s} loading={loading} />
                ))}
              </Box>
            )}
            <Stack spacing={3} mb={3}>
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", md: "5fr 7fr" },
                  gap: 3,
                }}
              >
                <SectionCard
                  title="Breakdown"
                  headingId="reports-breakdown-heading"
                  elevation={1}
                  sx={{ display: "flex", flexDirection: "column" }}
                  contentSx={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  {loading ? (
                    <SpendingBreakdownLoadingState />
                  ) : (
                    <Box
                      sx={{ flex: 1, display: "flex", alignItems: "center" }}
                    >
                      <SpendingPieChart data={agg.totalByCategoryType} />
                    </Box>
                  )}
                </SectionCard>
                <SectionCard
                  title="Top Tags"
                  headingId="reports-tags-heading"
                  elevation={1}
                  sx={{ display: "flex", flexDirection: "column" }}
                  contentSx={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  {loading ? (
                    <ChartLoadingState height={400} showLegend={false} />
                  ) : (
                    <TagBarChart
                      data={agg.tagDiagramData}
                      activeTags={filters.tags}
                      onTagClick={handleQuickTagFilter}
                    />
                  )}
                </SectionCard>
              </Box>
              <SectionCard
                title="Monthly Overview"
                headingId="reports-monthly-heading"
                elevation={1}
              >
                {loading ? (
                  <ChartLoadingState height={360} legendItems={4} />
                ) : (
                  <SpendingBarChart data={agg.timeseries} />
                )}
              </SectionCard>
            </Stack>
            <SectionCard
              title="Transactions"
              headingId="reports-transactions-heading"
              elevation={1}
              action={
                <ToggleButtonGroup
                  exclusive
                  size="small"
                  value={transactionsView}
                  onChange={(_event, nextView) => {
                    if (nextView !== null) {
                      const resolvedView = nextView as TransactionsViewMode;
                      setTransactionsView(resolvedView);
                      setLastSelectedReportTransactionsView(resolvedView);
                    }
                  }}
                  aria-label="Choose the transaction results view"
                  sx={{
                    "& .MuiToggleButtonGroup-grouped": {
                      px: 1.5,
                      textTransform: "none",
                    },
                  }}
                >
                  <ToggleButton value="table" aria-label="Table view">
                    <ViewListIcon sx={{ fontSize: 18, mr: 0.5 }} />
                    Table
                  </ToggleButton>
                  <ToggleButton value="calendar" aria-label="Calendar view">
                    <CalendarMonthIcon sx={{ fontSize: 18, mr: 0.5 }} />
                    Calendar
                  </ToggleButton>
                </ToggleButtonGroup>
              }
            >
              {transactionsView === "table" ? (
                <TransactionsTable
                  transactions={filtered}
                  activeTags={filters.tags}
                  onEdit={handleEditTransaction}
                  onDuplicate={handleDuplicateTransaction}
                  onDelete={handleDeleteTransaction}
                  onTagClick={handleQuickTagFilter}
                />
              ) : (
                <TransactionCalendar
                  transactions={filtered}
                  onDaySelect={handleAddTransaction}
                  onTransactionSelect={setDetailTarget}
                />
              )}
            </SectionCard>
          </Box>
        </>
      )}
      <TransactionDetailDialog
        open={Boolean(detailTarget)}
        transaction={detailTarget}
        onClose={() => setDetailTarget(null)}
        onEdit={(transaction) => {
          setDetailTarget(null);
          handleEditTransaction(transaction);
        }}
        onDuplicate={handleDuplicateTransaction}
        onDelete={handleDeleteTransaction}
      />
      <TransactionForm
        open={formOpen}
        initialDate={newTransactionDate}
        transaction={editTarget}
        duplicateTransaction={duplicateTarget}
        onSave={handleSaveTransaction}
        onClose={handleFormClose}
      />
      <ImportCsvDialog
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onImported={() => {
          void loadTransactions();
        }}
      />
      <MonthComparisonModal
        open={compareOpen}
        transactions={allTransactions}
        onClose={() => setCompareOpen(false)}
      />
      <YearComparisonModal
        open={yearCompareOpen}
        transactions={allTransactions}
        onClose={() => setYearCompareOpen(false)}
      />
      <Dialog
        open={yearlyReportOpen}
        onClose={() => setYearlyReportOpen(false)}
        fullWidth
        maxWidth="xl"
        scroll="paper"
        className="yearly-report-dialog"
        aria-labelledby="yearly-report-heading"
      >
        {!loading && (
          <YearlyReport
            report={yearlyReport}
            availableYears={availableYears}
            currentYear={currentYear}
            onYearChange={setSelectedReportYear}
          />
        )}
      </Dialog>
      {!isEmpty && (
        <Fab
          color="primary"
          aria-label="Add transaction"
          sx={{
            position: "fixed",
            bottom: 32,
            right: 32,
            display: { xs: "none", md: "inline-flex" },
          }}
          onClick={() => handleAddTransaction()}
        >
          <AddIcon />
        </Fab>
      )}
    </Container>
  );
};

export default ReportsPageContent;
