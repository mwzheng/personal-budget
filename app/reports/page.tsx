// Note 1: ReportsPage is the main data entry and analytics view. Transaction
// CRUD/import/export flows all go through authenticated API routes so the page
// state always reflects the currently signed-in Cognito user.
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
import Typography from "@mui/material/Typography";
import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { FilterBar } from "@/components/ui/FilterBar";
import { ImportCsvDialog } from "@/components/transactions/ImportCsvDialog";
import { TransactionForm } from "@/components/transactions/TransactionForm";
import { TransactionsTable } from "@/components/transactions/TransactionsTable";
import { apiFetch } from "@/lib/apiFetch";
import {
  createYearDateRange,
  filterTransactions,
  aggregateTransactions,
  getAllTags,
  getAvailableReportYears,
  resolveDefaultReportYear,
} from "@/lib/aggregations";
import { getLastSelectedReportYear } from "@/lib/storage";
import { FilterParams, ReportsAggregates, Transaction } from "@/lib/types";

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
    loading: () => <Skeleton variant="rectangular" height={280} />,
  },
);
const SpendingBarChart = dynamic(
  () =>
    import("@/components/charts/SpendingBarChart").then(
      (m) => m.SpendingBarChart,
    ),
  {
    ssr: false,
    loading: () => <Skeleton variant="rectangular" height={300} />,
  },
);
const TagBarChart = dynamic(
  () => import("@/components/charts/TagBarChart").then((m) => m.TagBarChart),
  {
    ssr: false,
    loading: () => <Skeleton variant="rectangular" height={400} />,
  },
);

// Note 3: `EMPTY_AGGREGATES` is a zero-value sentinel that satisfies the
// `ReportsAggregates` type contract when there are no transactions to aggregate.
// Passing this to charts instead of `null` avoids null checks inside each chart
// component, simplifying their props interface.
const EMPTY_AGGREGATES: ReportsAggregates = {
  totalAmount: 0,
  totalByCategoryType: { Need: 0, Want: 0, Saving: 0 },
  timeseries: [],
  tagDiagramData: [],
};

const EMPTY_FILTERS: FilterParams = {
  startDate: null,
  endDate: null,
  tags: [],
  search: "",
};

function buildYearFilters(year: string): FilterParams {
  const { startDate, endDate } = createYearDateRange(year);
  return {
    ...EMPTY_FILTERS,
    startDate,
    endDate,
  };
}

function buildQuickTagFilters(
  currentFilters: FilterParams,
  tag: string,
): FilterParams {
  // Note 4a: Quick-tag clicks act as a focused drill-down. Keeping the current
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

// Note 4: `StatCard` and `EmptyState` are defined as module-level functions
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
  const [importOpen, setImportOpen] = useState(false);
  const router = useRouter();

  function applyTransactions(
    transactions: Transaction[],
    opts?: { resetFilters?: boolean },
  ) {
    setAllTransactions(transactions);

    if (opts?.resetFilters) {
      const resolvedYear = resolveDefaultReportYear(
        transactions,
        getLastSelectedReportYear(),
      );
      setFilters(buildYearFilters(resolvedYear));
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
    const hasToken =
      typeof window !== "undefined" &&
      (sessionStorage.getItem("access_token") ||
        sessionStorage.getItem("id_token"));

    if (!disableAuth && !hasToken) {
      router.replace("/auth/login");
      return;
    }

    void loadTransactions({ resetFilters: true });
    // Note 5: The initial load should happen once on mount. `router` is stable
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
    if (!transaction) return;

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
        return;
      }

      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Failed to delete transaction");
      }

      await loadTransactions();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to delete transaction",
      );
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

  // Note 6: `useMemo` caches the result of these expensive operations and only
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
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        mb={3}
        flexWrap="wrap"
        gap={2}
      >
        <Typography variant="h4" fontWeight={700}>
          Spending Reports
        </Typography>
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

          {/* Summary stats */}
          <Grid container spacing={2} mb={3}>
            {(
              [
                {
                  label: "Total Spending",
                  value: fmt(agg.totalAmount),
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

          {/* Charts row 1: Pie + Stacked Bar */}
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
                <CardContent>
                  <SpendingPieChart data={agg.totalByCategoryType} />
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
                <CardContent>
                  <SpendingBarChart data={agg.timeseries} />
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Charts row 2: Top Tags */}
          <Card sx={{ mb: 3 }}>
            <CardHeader
              title="Top Spending Tags"
              subheader="Aggregated spend by tag across filtered transactions. Click a bar to focus on one tag."
              titleTypographyProps={{ variant: "subtitle1", fontWeight: 600 }}
              subheaderTypographyProps={{ variant: "caption" }}
            />
            <Divider />
            <CardContent>
              <TagBarChart
                data={agg.tagDiagramData}
                activeTags={filters.tags}
                onTagClick={handleQuickTagFilter}
              />
            </CardContent>
          </Card>

          {/* Transactions table */}
          <Box mb={1} display="flex" alignItems="baseline" gap={1}>
            <Typography variant="h6" fontWeight={600}>
              Transactions
            </Typography>
            <Typography variant="body2" color="text.secondary">
              ({filtered.length} results)
            </Typography>
          </Box>
          <TransactionsTable
            transactions={filtered}
            activeTags={filters.tags}
            onEdit={handleEditTransaction}
            onDelete={handleDeleteTransaction}
            onTagClick={handleQuickTagFilter}
          />
        </>
      )}

      {/* Add/Edit transaction dialog */}
      <TransactionForm
        open={formOpen}
        transaction={editTarget}
        onSave={handleSaveTransaction}
        onClose={handleFormClose}
      />

      {/* Import CSV dialog */}
      <ImportCsvDialog
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onImported={() => {
          void loadTransactions({ resetFilters: allTransactions.length === 0 });
        }}
      />

      {/* Note 7: The Floating Action Button (FAB) is a Material Design pattern
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
