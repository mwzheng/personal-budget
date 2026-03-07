'use client';

import AddIcon from '@mui/icons-material/Add';
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import FileUploadOutlinedIcon from '@mui/icons-material/FileUploadOutlined';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import Container from '@mui/material/Container';
import Divider from '@mui/material/Divider';
import Fab from '@mui/material/Fab';
import Grid from '@mui/material/Grid';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import dynamic from 'next/dynamic';
import { useEffect, useMemo, useState } from 'react';

import { FilterBar } from '@/components/FilterBar';
import { ImportCsvDialog } from '@/components/ImportCsvDialog';
import { TransactionForm } from '@/components/TransactionForm';
import { TransactionsTable } from '@/components/TransactionsTable';
import { filterTransactions, aggregateTransactions, getAllTags } from '@/lib/aggregations';
import { downloadTransactionsCsv } from '@/lib/csvExport';
import {
  getTransactions,
  addTransaction,
  updateTransaction,
  deleteTransaction,
} from '@/lib/storage';
import { FilterParams, ReportsAggregates, Transaction } from '@/lib/types';

// Lazy-load heavy chart bundles
const SpendingPieChart = dynamic(
  () => import('@/components/SpendingPieChart').then((m) => m.SpendingPieChart),
  { ssr: false, loading: () => <Skeleton variant="rectangular" height={280} /> },
);
const SpendingBarChart = dynamic(
  () => import('@/components/SpendingBarChart').then((m) => m.SpendingBarChart),
  { ssr: false, loading: () => <Skeleton variant="rectangular" height={300} /> },
);
const TagBarChart = dynamic(
  () => import('@/components/TagBarChart').then((m) => m.TagBarChart),
  { ssr: false, loading: () => <Skeleton variant="rectangular" height={400} /> },
);

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
  search: '',
};

interface StatCardProps {
  label: string;
  value: string;
  color: string;
  loading: boolean;
}

function StatCard({ label, value, color, loading }: StatCardProps) {
  return (
    <Card>
      <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
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
      <Typography variant="body2" color="text.secondary" textAlign="center" maxWidth={400}>
        Add transactions manually or import a CSV file matching the{' '}
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
        <Button variant="contained" startIcon={<AddIcon />} onClick={onAddClick}>
          Add Transaction
        </Button>
      </Stack>
    </Box>
  );
}

export default function ReportsPage() {
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<FilterParams>(EMPTY_FILTERS);
  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Transaction | undefined>(undefined);
  const [importOpen, setImportOpen] = useState(false);

  // Load from localStorage on mount (client-side only)
  useEffect(() => {
    setAllTransactions(getTransactions());
    setLoading(false);
  }, []);

  function refreshFromStorage() {
    setAllTransactions(getTransactions());
  }

  function handleSaveTransaction(t: Transaction) {
    if (editTarget) {
      updateTransaction(t);
    } else {
      addTransaction(t);
    }
    refreshFromStorage();
    setFormOpen(false);
    setEditTarget(undefined);
  }

  function handleEditTransaction(t: Transaction) {
    setEditTarget(t);
    setFormOpen(true);
  }

  function handleDeleteTransaction(id: string) {
    deleteTransaction(id);
    refreshFromStorage();
  }

  function handleFormClose() {
    setFormOpen(false);
    setEditTarget(undefined);
  }

  function handleExport() {
    downloadTransactionsCsv(filtered, 'transactions_export.csv');
  }

  const availableTags = useMemo(() => getAllTags(allTransactions), [allTransactions]);

  const filtered = useMemo(
    () => filterTransactions(allTransactions, filters),
    [allTransactions, filters],
  );

  const agg = useMemo(
    () => (filtered.length > 0 ? aggregateTransactions(filtered) : EMPTY_AGGREGATES),
    [filtered],
  );

  const fmt = (v: number) =>
    v.toLocaleString('en-US', { style: 'currency', currency: 'USD' });

  const isEmpty = !loading && allTransactions.length === 0;

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={3} flexWrap="wrap" gap={2}>
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

      {isEmpty ? (
        <EmptyState
          onAddClick={() => setFormOpen(true)}
          onImportClick={() => setImportOpen(true)}
        />
      ) : (
        <>
          {loading ? (
            <Skeleton variant="rectangular" height={100} sx={{ mb: 3, borderRadius: 1 }} />
          ) : (
            <FilterBar availableTags={availableTags} onChange={setFilters} />
          )}

          {/* Summary stats */}
          <Grid container spacing={2} mb={3}>
            {(
              [
                { label: 'Total Spending', value: fmt(agg.totalAmount), color: '#ddd' },
                { label: 'Needs', value: fmt(agg.totalByCategoryType.Need), color: '#ef5350' },
                { label: 'Wants', value: fmt(agg.totalByCategoryType.Want), color: '#42a5f5' },
                { label: 'Savings', value: fmt(agg.totalByCategoryType.Saving), color: '#66bb6a' },
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
              <Card sx={{ height: '100%' }}>
                <CardHeader
                  title="Category Breakdown"
                  titleTypographyProps={{ variant: 'subtitle1', fontWeight: 600 }}
                />
                <Divider />
                <CardContent>
                  <SpendingPieChart data={agg.totalByCategoryType} />
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={7}>
              <Card sx={{ height: '100%' }}>
                <CardHeader
                  title="Spending Over Time"
                  titleTypographyProps={{ variant: 'subtitle1', fontWeight: 600 }}
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
              subheader="Aggregated spend by tag across filtered transactions"
              titleTypographyProps={{ variant: 'subtitle1', fontWeight: 600 }}
              subheaderTypographyProps={{ variant: 'caption' }}
            />
            <Divider />
            <CardContent>
              <TagBarChart data={agg.tagDiagramData} />
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
            onEdit={handleEditTransaction}
            onDelete={handleDeleteTransaction}
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
        onImported={refreshFromStorage}
      />

      {/* FAB to add transaction (shown when data exists) */}
      {!isEmpty && (
        <Fab
          color="primary"
          aria-label="Add transaction"
          sx={{ position: 'fixed', bottom: 32, right: 32 }}
          onClick={() => setFormOpen(true)}
        >
          <AddIcon />
        </Fab>
      )}
    </Container>
  );
}
