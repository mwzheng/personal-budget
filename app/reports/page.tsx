// Note 1: ReportsPage is the main data entry and analytics view. Real users read
// and write through authenticated API routes, while demo sessions transparently
// use the `apiFetch` demo shim so the rest of the screen can stay unchanged.
"use client";

import AddIcon from "@mui/icons-material/Add";
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
import { getLastSelectedReportYears } from "@/lib/utils/storage";
import {
  FilterParams,
  ReportsAggregates,
  Transaction,
} from "@/lib/types/types";

// Note 2: All three chart components use `{ ssr: false }` because they depend
// on Recharts' `ResponsiveContainer` which reads `offsetWidth` from a DOM element.
// During server-side rendering that DOM element does not exist, causing errors.
// The `loading` prop renders a Skeleton placeholder while the bundle downloads.
const SpendingPieChart = dynamic(
  () =>
    import("@/components/charts/SpendingPieChart").then(
      (m) => m.SpendingPieChart,
    ),
  {
    ssr: false,
    loading: () => <ChartLoadingState height={280} legendItems={3} />,
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

// Note 3: `EMPTY_AGGREGATES` is a zero-value sentinel that satisfies the
// `ReportsAggregates` type contract when there are no transactions to aggregate.
// Passing this to charts instead of `null` avoids null checks inside each chart
// component, simplifying their props interface.
const EMPTY_AGGREGATES: ReportsAggregates = {
  totalAmount: 0,
  spendingAmount: 0,
  totalByCategoryType: { Need: 0, Want: 0, Saving: 0 },
  timeseries: [],
  tagDiagramData: [],
};

const EMPTY_FILTERS: FilterParams = {
  years: [],
  startDate: null,
  endDate: null,
  tags: [],
  search: "",
};

type TransactionsViewMode = "table" | "calendar";
const PAGE_TITLE_ID = "reports-page-title";
const PAGE_DESCRIPTION_ID = "reports-page-description";

function buildYearFilters(years: string[]): FilterParams {
  return {
    ...EMPTY_FILTERS,
    years,
  };
}

function buildQuickTagFilters(
  currentFilters: FilterParams,
  tag: string,
): FilterParams {
  // Note 4: Quick-tag clicks act as a focused drill-down. Keeping the current
  // date/search filters intact while swapping to a single selected tag makes the
  // shortcut predictable and easy to toggle off by clicking the same tag again.
  const nextTags =
    currentFilters.tags.length === 1 && currentFilters.tags[0] === tag
      ? []
      : [tag];

  return { ...currentFilters, tags: nextTags };
}

interface StatCardProps {
  label: string;
  value: string;
  color: string;
  loading: boolean;
}

// Note 5: `StatCard` and `EmptyState` are defined as module-level functions
// rather than in a separate file because they are small, single-use sub-components
// with no state of their own. Co-locating them with their only consumer avoids
// unnecessary file fragmentation.
function StatCard({ label, value, color, loading }: StatCardProps) {
  return (
    <Card>
      <CardContent sx={{ py: 1.5, "&:last-child": { pb: 1.5 } }}>
        <Typography variant="body2" color="text.secondary">
          {label}
        </Typography>
        {loading ? (
          <Skeleton width={90} height={32} />
        ) : (
          <Typography variant="h6" fontWeight={700} sx={{ color }}>
            {value}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}

function EmptyState({
  onAddClick,
  onImportClick,
}: {
  onAddClick: () => void;
  onImportClick: () => void;
}) {
  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      py={10}
      gap={2}
    >
      <Typography variant="h5" fontWeight={600} color="text.secondary">
        No transactions yet
      </Typography>
      <Typography
        variant="body2"
        color="text.secondary"
        textAlign="center"
        maxWidth={400}
      >
        Add transactions manually or import a CSV file matching the{" "}
        <code>expenses.csv</code> format.
      </Typography>
      <Stack direction="row" gap={2} mt={1}>
        <Button
          variant="outlined"
          startIcon={<FileUploadOutlinedIcon />}
          onClick={onImportClick}
        >
          Import CSV
        </Button>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={onAddClick}
        >
          Add Transaction
        </Button>
      </Stack>
    </Box>
  );
}

interface TransactionsApiResponse {
  ok?: boolean;
  error?: string;
  transactions?: Transaction[];
}

export default function ReportsPage() {
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterParams>(EMPTY_FILTERS);
  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Transaction | undefined>(
    undefined,
  );
  // Note 6: The active view is UI-only state. Keeping it beside the filtered
  // transaction data means the table and calendar stay perfectly in sync without
  // triggering extra API calls or maintaining parallel copies of the same list.
  const [transactionsView, setTransactionsView] =
    useState<TransactionsViewMode>("table");
  const [detailTarget, setDetailTarget] = useState<Transaction | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const router = useRouter();

  function applyTransactions(
    transactions: Transaction[],
    opts?: { resetFilters?: boolean },
  ) {
    setAllTransactions(transactions);

    if (opts?.resetFilters) {
      const resolvedYears = resolveDefaultReportYears(
        transactions,
        getLastSelectedReportYears(),
      );
      setFilters(buildYearFilters(resolvedYears));
    }
  }

  async function loadTransactions(opts?: { resetFilters?: boolean }) {
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
  }

  useEffect(() => {
    const disableAuth = process.env.NEXT_PUBLIC_DISABLE_AUTH === "true";

    // Note 7: `isAuthenticated()` now covers both real Cognito tokens and the
    // dedicated demo-session flag, so protected pages accept demo mode without
    // having to know how that browser-only session is implemented.
    if (!disableAuth && !isAuthenticated()) {
      router.replace("/auth/login");
      return;
    }

    void loadTransactions({ resetFilters: true });
    // Note 8: The initial load should happen once on mount. `router` is stable
    // enough for this redirect flow, and the inline async call avoids reading
    // transaction data from browser storage before the auth-scoped API responds.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  async function handleSaveTransaction(t: Transaction) {
    const wasEmpty = allTransactions.length === 0;
    setErrorMessage(null);

    try {
      const res = await apiFetch("/api/transactions", {
        method: editTarget ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(t),
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
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to save transaction",
      );
    }
  }

  function handleEditTransaction(t: Transaction) {
    setEditTarget(t);
    setFormOpen(true);
  }

  async function handleDeleteTransaction(id: string) {
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
  }

  function handleFormClose() {
    setFormOpen(false);
    setEditTarget(undefined);
  }

  async function handleExport() {
    setErrorMessage(null);

    try {
      const params = new URLSearchParams();
      if (filters.years.length > 0)
        params.set("years", filters.years.join(","));
      if (filters.startDate) params.set("startDate", filters.startDate);
      if (filters.endDate) params.set("endDate", filters.endDate);
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
  }

  function handleQuickTagFilter(tag: string) {
    setFilters((currentFilters) => buildQuickTagFilters(currentFilters, tag));
  }

  // Note 9: `useMemo` caches the result of these expensive operations and only
  // recomputes when their dependencies change. Without memoization, `getAllTags`,
  // `filterTransactions`, and `aggregateTransactions` would run on every render
  // (e.g., when a dialog opens), wasting CPU on unchanged data.
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

  const fmt = (v: number) =>
    v.toLocaleString("en-US", { style: "currency", currency: "USD" });

  const isEmpty = !loading && allTransactions.length === 0;

  return (
    <Container
      component="main"
      maxWidth="xl"
      aria-labelledby={PAGE_TITLE_ID}
      aria-describedby={PAGE_DESCRIPTION_ID}
      sx={{ py: 4 }}
    >
      <Box
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        mb={3}
        flexWrap="wrap"
        gap={2}
      >
        <Box>
          <Typography
            id={PAGE_TITLE_ID}
            component="h1"
            variant="h4"
            fontWeight={700}
          >
            Spending Reports
          </Typography>
          <Typography
            id={PAGE_DESCRIPTION_ID}
            variant="body2"
            color="text.secondary"
            sx={{ mt: 0.5 }}
          >
            Filter transactions, compare charts, and manage CSV imports from one
            reporting dashboard.
          </Typography>
        </Box>
        {!isEmpty && (
          <Stack direction="row" gap={1}>
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
        )}
      </Box>

      {errorMessage && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {errorMessage}
        </Alert>
      )}

      {isEmpty ? (
        <EmptyState
          onAddClick={() => setFormOpen(true)}
          onImportClick={() => setImportOpen(true)}
        />
      ) : (
        <>
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

          <Grid container spacing={2} mb={3}>
            {(
              [
                {
                  label: "Total Spending",
                  value: fmt(agg.spendingAmount),
                  color: "#ddd",
                },
                {
                  label: "Needs",
                  value: fmt(agg.totalByCategoryType.Need),
                  color: "#ef5350",
                },
                {
                  label: "Wants",
                  value: fmt(agg.totalByCategoryType.Want),
                  color: "#42a5f5",
                },
                {
                  label: "Savings",
                  value: fmt(agg.totalByCategoryType.Saving),
                  color: "#66bb6a",
                },
              ] as const
            ).map((s) => (
              <Grid item xs={6} sm={3} key={s.label}>
                <StatCard {...s} loading={loading} />
              </Grid>
            ))}
          </Grid>

          <Grid container spacing={3} mb={3}>
            <Grid item xs={12} md={5}>
              <Card sx={{ height: "100%" }}>
                <CardHeader
                  title="Category Breakdown"
                  titleTypographyProps={{
                    variant: "subtitle1",
                    fontWeight: 600,
                  }}
                />
                <Divider />
                <CardContent sx={{ p: 3 }}>
                  {loading ? (
                    <ChartLoadingState height={280} legendItems={3} />
                  ) : (
                    <SpendingPieChart data={agg.totalByCategoryType} />
                  )}
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={7}>
              <Card sx={{ height: "100%" }}>
                <CardHeader
                  title="Spending Over Time"
                  titleTypographyProps={{
                    variant: "subtitle1",
                    fontWeight: 600,
                  }}
                />
                <Divider />
                <CardContent sx={{ p: 3 }}>
                  {loading ? (
                    <ChartLoadingState height={300} legendItems={3} />
                  ) : (
                    <SpendingBarChart data={agg.timeseries} />
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <Card sx={{ mb: 3 }}>
            <CardHeader
              title="Top Spending Tags"
              subheader="Aggregated spend by tag across filtered transactions. Click a bar to focus on one tag."
              titleTypographyProps={{ variant: "subtitle1", fontWeight: 600 }}
              subheaderTypographyProps={{ variant: "caption" }}
            />
            <Divider />
            <CardContent sx={{ p: 3 }}>
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
            {/* Note 10: An exclusive toggle keeps the table as the familiar
                default while letting users switch to the calendar without losing
                the current filters or the shared edit/delete handlers. */}
            <ToggleButtonGroup
              exclusive
              size="small"
              value={transactionsView}
              onChange={(_event, nextView) => {
                if (nextView !== null) {
                  setTransactionsView(nextView as TransactionsViewMode);
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

      {/* Note 11: The Floating Action Button (FAB) is a Material Design pattern
           for the primary action on a page. Positioning it `fixed` at the bottom
           right corner keeps it always accessible regardless of scroll position.
           It is hidden on the empty state so the EmptyState CTA is the focal point. */}
      {!isEmpty && (
        <Fab
          color="primary"
          aria-label="Add transaction"
          sx={{ position: "fixed", bottom: 32, right: 32 }}
          onClick={() => setFormOpen(true)}
        >
          <AddIcon />
        </Fab>
      )}
    </Container>
  );
}
