"use client";

import AddIcon from "@mui/icons-material/Add";
import CompareArrowsIcon from "@mui/icons-material/CompareArrows";
import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";
import FileUploadOutlinedIcon from "@mui/icons-material/FileUploadOutlined";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardHeader from "@mui/material/CardHeader";
import Container from "@mui/material/Container";
import Divider from "@mui/material/Divider";
import Fab from "@mui/material/Fab";
import Grid from "@mui/material/Grid";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Typography from "@mui/material/Typography";
import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { ChartLoadingState } from "@/components/charts/ChartLoadingState";
import { FilterBar } from "@/components/ui/FilterBar";
import PageHeader from "@/components/ui/PageHeader";
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
  resolveDefaultReportYears,
} from "@/lib/utils/aggregations";
import {
  getLastSelectedReportTransactionsView,
  getLastSelectedReportYears,
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
  buildYearFilters,
  buildQuickTagFilters,
  buildComparablePeriodFilters,
  buildStatTrend,
} from "@/lib/utils/reportUtils";

const SpendingPieChart = dynamic(
  () =>
    import("@/components/charts/SpendingPieChart").then(
      (m) => m.SpendingPieChart,
    ),
  {
    ssr: false,
    loading: () => <SpendingBreakdownLoadingState />,
  },
);
const SpendingBarChart = dynamic(
  () =>
    import("@/components/charts/SpendingBarChart").then(
      (m) => m.SpendingBarChart,
    ),
  {
    ssr: false,
    loading: () => <ChartLoadingState height={300} legendItems={3} />,
  },
);
const TagBarChart = dynamic(
  () => import("@/components/charts/TagBarChart").then((m) => m.TagBarChart),
  {
    ssr: false,
    loading: () => <ChartLoadingState height={400} showLegend={false} />,
  },
);
const MonthComparisonModal = dynamic(
  () =>
    import("@/components/charts/MonthComparisonModal").then(
      (m) => m.MonthComparisonModal,
    ),
  { ssr: false },
);

interface TransactionsApiResponse {
  ok?: boolean;
  error?: string;
  transactions?: Transaction[];
}

const ReportsPageContent = () => {
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Transaction | undefined>(
    undefined,
  );
  const [newTransactionDate, setNewTransactionDate] = useState<string | null>(
    null,
  );
  const [transactionsView, setTransactionsView] =
    useState<TransactionsViewMode>("table");
  const [detailTarget, setDetailTarget] = useState<Transaction | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [compareOpen, setCompareOpen] = useState(false);
  const router = useRouter();

  const applyTransactions = (
    transactions: Transaction[],
    opts?: { resetFilters?: boolean },
  ) => {
    setAllTransactions(transactions);

    if (opts?.resetFilters) {
      const resolvedYears = resolveDefaultReportYears(
        transactions,
        getLastSelectedReportYears(),
      );
      setFilters(buildYearFilters(resolvedYears));
    }
  };

  const loadTransactions = async (opts?: { resetFilters?: boolean }) => {
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

      applyTransactions(data.transactions ?? [], opts);
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

    void loadTransactions({ resetFilters: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  useEffect(() => {
    setTransactionsView(getLastSelectedReportTransactionsView());
  }, []);

  const handleSaveTransaction = async (t: Transaction) => {
    const wasEmpty = allTransactions.length === 0;
    setErrorMessage(null);

    try {
      const res = await apiFetch("/api/transactions", {
        method: editTarget ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          editTarget ? { ...t, originalDate: editTarget.date } : t,
        ),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        error?: string;
      };

      if (res.status === 401 || res.status === 403) {
        router.replace("/auth/login");
        return;
      }

      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Failed to save transaction");
      }

      await loadTransactions({ resetFilters: wasEmpty });
      setFormOpen(false);
      setEditTarget(undefined);
      setNewTransactionDate(null);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to save transaction",
      );
    }
  };

  const handleEditTransaction = (t: Transaction) => {
    setNewTransactionDate(null);
    setEditTarget(t);
    setFormOpen(true);
  };

  const handleAddTransaction = (date?: string) => {
    setEditTarget(undefined);
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
      const data = (await res.json()) as {
        ok?: boolean;
        error?: string;
      };

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
      if (filters.categories.length > 0) {
        params.set("categories", filters.categories.join(","));
      }
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
      sx={{ py: 4 }}
    >
      <PageHeader
        title="Income & Spending Reports"
        description="Filter transactions, compare spending with income, and manage CSV imports from one reporting dashboard."
        headingId={PAGE_TITLE_ID}
        descriptionId={PAGE_DESCRIPTION_ID}
        sx={{ mb: 3 }}
        action={
          !isEmpty ? (
            <Stack direction="row" gap={1} flexWrap="wrap">
              <Button
                variant="outlined"
                size="small"
                startIcon={<CompareArrowsIcon />}
                onClick={() => setCompareOpen(true)}
              >
                Compare
              </Button>
              <Button
                variant="outlined"
                size="small"
                startIcon={<FileUploadOutlinedIcon />}
                onClick={() => setImportOpen(true)}
              >
                Import CSV
              </Button>
              <Button
                variant="outlined"
                size="small"
                startIcon={<FileDownloadOutlinedIcon />}
                onClick={handleExport}
                disabled={filtered.length === 0}
              >
                Export CSV
              </Button>
            </Stack>
          ) : undefined
        }
      />

      {errorMessage && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {errorMessage}
        </Alert>
      )}

      {isEmpty ? (
        <EmptyState
          onAddClick={() => handleAddTransaction()}
          onImportClick={() => setImportOpen(true)}
        />
      ) : (
        <>
          <Box
            role="toolbar"
            aria-label="Report actions"
            sx={{
              display: { xs: "flex", md: "none" },
              mb: 2,
            }}
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
              variant="rectangular"
              height={100}
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

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "repeat(2, minmax(0, 1fr))",
                md: "repeat(5, minmax(0, 1fr))",
              },
              gap: 2,
              mb: 3,
            }}
          >
            {(
              [
                {
                  label: "Total Income",
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
                  label: "Total Spending",
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
                  color: "#ef5350",
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
                  color: "#66bb6a",
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

          <Grid container spacing={3} mb={3}>
            <Grid item xs={12} md={5}>
              <Card
                sx={{
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <CardHeader
                  title="Spending Breakdown"
                  titleTypographyProps={{
                    variant: "subtitle1",
                    fontWeight: 600,
                  }}
                />
                <Divider />
                <CardContent
                  sx={{
                    p: 3,
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  {loading ? (
                    <SpendingBreakdownLoadingState />
                  ) : (
                    <SpendingPieChart data={agg.totalByCategoryType} />
                  )}
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={7}>
              <Card
                sx={{
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <CardHeader
                  title="Top Spending Tags"
                  titleTypographyProps={{
                    variant: "subtitle1",
                    fontWeight: 600,
                  }}
                />
                <Divider />
                <CardContent sx={{ p: 3, flex: 1 }}>
                  {loading ? (
                    <ChartLoadingState height={400} showLegend={false} />
                  ) : (
                    <TagBarChart
                      data={agg.tagDiagramData}
                      activeTags={filters.tags}
                      onTagClick={handleQuickTagFilter}
                    />
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <Card sx={{ mb: 3 }}>
            <CardHeader
              title="Spending vs Income"
              titleTypographyProps={{ variant: "subtitle1", fontWeight: 600 }}
            />
            <Divider />
            <CardContent sx={{ p: 3 }}>
              {loading ? (
                <ChartLoadingState height={360} legendItems={4} />
              ) : (
                <SpendingBarChart data={agg.timeseries} />
              )}
            </CardContent>
          </Card>

          <Box
            mb={1.5}
            display="flex"
            alignItems={{ xs: "stretch", sm: "center" }}
            justifyContent="space-between"
            flexWrap="wrap"
            gap={2}
          >
            <Box display="flex" alignItems="baseline" gap={1}>
              <Typography variant="h6" fontWeight={600}>
                Transactions
              </Typography>
              <Typography variant="body2" color="text.secondary">
                ({filtered.length} results)
              </Typography>
            </Box>
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
              <ToggleButton
                value="table"
                aria-label="Show transactions in the table view"
              >
                Table
              </ToggleButton>
              <ToggleButton
                value="calendar"
                aria-label="Show transactions in the calendar view"
              >
                Calendar
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>
          {transactionsView === "table" ? (
            <TransactionsTable
              transactions={filtered}
              activeTags={filters.tags}
              onEdit={handleEditTransaction}
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
        onDelete={handleDeleteTransaction}
      />

      <TransactionForm
        open={formOpen}
        initialDate={newTransactionDate}
        transaction={editTarget}
        onSave={handleSaveTransaction}
        onClose={handleFormClose}
      />

      <ImportCsvDialog
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onImported={() => {
          void loadTransactions({ resetFilters: allTransactions.length === 0 });
        }}
      />

      <MonthComparisonModal
        open={compareOpen}
        transactions={allTransactions}
        onClose={() => setCompareOpen(false)}
      />

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
