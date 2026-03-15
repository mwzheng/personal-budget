// Note 1: This page is a Client Component because the planner is entirely
// interactive: the user edits draft rows, previews the pie chart and Sankey in
// real time, and saves budgets without leaving the page.
"use client";

import { apiFetch } from "../../lib/apiFetch";

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardHeader from "@mui/material/CardHeader";
import Chip from "@mui/material/Chip";
import Container from "@mui/material/Container";
import Divider from "@mui/material/Divider";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import dynamic from "next/dynamic";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { BudgetForm } from "@/components/budget/BudgetForm";
import { BudgetList } from "@/components/budget/BudgetList";
import { BudgetPieChart } from "@/components/charts/BudgetPieChart";
import {
  buildBudgetInsights,
  CATEGORY_COLORS,
  CATEGORY_LABELS,
  CATEGORY_ORDER,
  createDefaultBudgetDraft,
  BudgetDraft,
  hasBudgetRowContent,
  normalizeBudgetForEditor,
  normalizeBudgetForStorage,
  sortSavedBudgets,
} from "@/lib/budget-planner";
import { SavedBudget } from "@/lib/types";

const SankeyChart = dynamic(
  () =>
    import("@/components/charts/SankeyChart").then(
      (module) => module.SankeyChart,
    ),
  {
    ssr: false,
    loading: () => <Skeleton variant="rectangular" height={520} />,
  },
);

function formatCurrency(value: number): string {
  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

const SUMMARY_CARD_SX = {
  flex: 1,
  minWidth: 180,
  p: 2,
  border: "1px solid",
  borderColor: "divider",
  borderRadius: 2,
};
const SECTION_HEADER_SX = {
  px: { xs: 2.5, sm: 3 },
  py: 2.25,
};
const SECTION_CONTENT_SX = {
  px: { xs: 2.5, sm: 3 },
  py: { xs: 2.5, sm: 3 },
};

export default function SankeyPage() {
  const [draft, setDraft] = useState<BudgetDraft>(createDefaultBudgetDraft);
  const [editingBudgetId, setEditingBudgetId] = useState<string | null>(null);
  const [budgetsReloadKey, setBudgetsReloadKey] = useState(0);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [instructionsOpen, setInstructionsOpen] = useState(false);
  const hasAutoLoadedLatestBudget = useRef(false);
  const hasDraftChangesRef = useRef(false);

  const router = useRouter();

  useEffect(() => {
    if (process.env.NEXT_PUBLIC_DISABLE_AUTH === "true") {
      return;
    }

    const accessToken =
      typeof window !== "undefined"
        ? sessionStorage.getItem("access_token")
        : null;
    const idToken =
      typeof window !== "undefined" ? sessionStorage.getItem("id_token") : null;

    if (!accessToken && !idToken) {
      router.replace("/auth/login");
    }
  }, [router]);

  const insights = useMemo(() => buildBudgetInsights(draft), [draft]);
  const hasDraftChanges =
    Boolean(editingBudgetId) ||
    draft.name.trim().length > 0 ||
    draft.monthlyIncome !== 5000 ||
    draft.expenses.length > 1 ||
    draft.expenses.some(hasBudgetRowContent);

  useEffect(() => {
    hasDraftChangesRef.current = hasDraftChanges;
  }, [hasDraftChanges]);

  const handleBudgetsLoaded = useCallback((budgets: SavedBudget[]) => {
    if (hasAutoLoadedLatestBudget.current) {
      return;
    }

    hasAutoLoadedLatestBudget.current = true;
    if (hasDraftChangesRef.current) {
      return;
    }

    const latestBudget = sortSavedBudgets(budgets)[0];

    if (!latestBudget) {
      return;
    }

    const normalized = normalizeBudgetForEditor(latestBudget);
    setDraft(normalized);
    setEditingBudgetId(normalized.budgetId ?? null);
    setSaveError(null);
  }, []);

  async function saveBudget() {
    setSaving(true);
    setSaveError(null);

    try {
      const payload = normalizeBudgetForStorage({
        ...draft,
        budgetId: editingBudgetId ?? draft.budgetId,
      });
      const isEditing = Boolean(editingBudgetId);
      const response = await apiFetch(
        isEditing ? `/api/budgets/${editingBudgetId}` : "/api/budgets",
        {
          method: isEditing ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error?.message ?? data?.error ?? response.statusText,
        );
      }

      const persisted = normalizeBudgetForEditor(
        (data?.updated ?? data?.created ?? data) as SavedBudget,
      );

      setDraft(persisted);
      setEditingBudgetId(persisted.budgetId ?? null);
      setBudgetsReloadKey((current) => current + 1);
    } catch (caughtError) {
      setSaveError(
        caughtError instanceof Error
          ? caughtError.message
          : "Failed to save budget.",
      );
    } finally {
      setSaving(false);
    }
  }

  function loadBudget(budget: SavedBudget) {
    setDraft({
      ...normalizeBudgetForEditor(budget),
      budgetId: undefined,
    });
    setEditingBudgetId(null);
    setSaveError(null);
  }

  function editBudget(budget: SavedBudget) {
    const normalized = normalizeBudgetForEditor(budget);
    setDraft(normalized);
    setEditingBudgetId(normalized.budgetId ?? null);
    setSaveError(null);
  }

  function startFresh() {
    setDraft(createDefaultBudgetDraft());
    setEditingBudgetId(null);
    setSaveError(null);
  }

  const hasExpenses = insights.validExpenses.length > 0;

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Typography variant="h4" fontWeight={700} mb={1}>
        Budget Planner
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={4}>
        Plan monthly expenses, see each line item in the pie chart, and follow
        the grouped Sankey flow below.
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Card>
            <CardHeader
              title="Budget Section"
              subheader="Build an expense-based monthly budget and save reusable versions."
              titleTypographyProps={{ variant: "subtitle1", fontWeight: 700 }}
              subheaderTypographyProps={{ variant: "caption" }}
              action={
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<InfoOutlinedIcon />}
                  onClick={() => setInstructionsOpen(true)}
                >
                  Sankey Instructions
                </Button>
              }
              sx={SECTION_HEADER_SX}
            />
            <Divider />
            <CardContent sx={SECTION_CONTENT_SX}>
              <Grid container spacing={3} alignItems="start">
                <Grid item xs={12} lg={8} xl={8}>
                  <Stack spacing={3}>
                    <BudgetForm
                      value={draft}
                      saving={saving}
                      saveError={saveError}
                      isEditing={Boolean(editingBudgetId)}
                      onChange={setDraft}
                      onSave={saveBudget}
                      onStartFresh={startFresh}
                    />

                    <Card variant="outlined">
                      <CardHeader
                        title="Saved Budgets"
                        titleTypographyProps={{
                          variant: "subtitle1",
                          fontWeight: 700,
                        }}
                        action={
                          editingBudgetId ? (
                            <Chip
                              label="Editing Saved Budget"
                              size="small"
                              color="info"
                            />
                          ) : undefined
                        }
                        sx={SECTION_HEADER_SX}
                      />
                      <Divider />
                      <CardContent sx={SECTION_CONTENT_SX}>
                        <BudgetList
                          reloadKey={budgetsReloadKey}
                          onLoad={loadBudget}
                          onEdit={editBudget}
                          onBudgetsLoaded={handleBudgetsLoaded}
                        />
                      </CardContent>
                    </Card>
                  </Stack>
                </Grid>

                <Grid item xs={12} lg={4} xl={4}>
                  <Stack spacing={2.5}>
                    <Box display="flex" flexWrap="wrap" gap={2}>
                      <Paper variant="outlined" sx={SUMMARY_CARD_SX}>
                        <Typography variant="caption" color="text.secondary">
                          Monthly Income
                        </Typography>
                        <Typography variant="h6" fontWeight={700}>
                          {formatCurrency(insights.monthlyIncome)}
                        </Typography>
                      </Paper>
                      <Paper variant="outlined" sx={SUMMARY_CARD_SX}>
                        <Typography variant="caption" color="text.secondary">
                          Planned Expenses
                        </Typography>
                        <Typography variant="h6" fontWeight={700}>
                          {formatCurrency(insights.totalExpenses)}
                        </Typography>
                      </Paper>
                      <Paper variant="outlined" sx={SUMMARY_CARD_SX}>
                        <Typography variant="caption" color="text.secondary">
                          {insights.overspending > 0
                            ? "Overspending"
                            : insights.leftoverSavings > 0
                              ? "Leftover Savings"
                              : "Balance"}
                        </Typography>
                        <Typography
                          variant="h6"
                          fontWeight={700}
                          color={
                            insights.overspending > 0
                              ? "warning.main"
                              : "success.main"
                          }
                        >
                          {formatCurrency(
                            insights.overspending > 0
                              ? insights.overspending
                              : insights.leftoverSavings,
                          )}
                        </Typography>
                      </Paper>
                    </Box>

                    {hasExpenses && insights.overspending > 0 ? (
                      <Alert severity="warning">
                        You&apos;re overspending by{" "}
                        {formatCurrency(insights.overspending)}. Lower your
                        planned expenses or raise monthly income to get back on
                        budget.
                      </Alert>
                    ) : null}

                    {hasExpenses && insights.overspending === 0 ? (
                      <Alert severity="success">
                        {insights.leftoverSavings > 0
                          ? `${formatCurrency(insights.leftoverSavings)} is automatically added to Leftover Savings.`
                          : "Your planned expenses exactly match monthly income."}
                      </Alert>
                    ) : null}

                    <Card variant="outlined">
                      <CardHeader
                        title="Expense Pie Chart"
                        subheader="Each expense is a slice. Remaining income is added as Leftover Savings."
                        titleTypographyProps={{
                          variant: "subtitle1",
                          fontWeight: 700,
                        }}
                        subheaderTypographyProps={{ variant: "caption" }}
                        sx={SECTION_HEADER_SX}
                      />
                      <Divider />
                      <CardContent sx={SECTION_CONTENT_SX}>
                        <BudgetPieChart
                          data={insights.pieData}
                          monthlyIncome={insights.monthlyIncome}
                          leftoverSavings={insights.leftoverSavings}
                          overspending={insights.overspending}
                        />
                      </CardContent>
                    </Card>

                    <Paper variant="outlined" sx={{ overflowX: "auto" }}>
                      <Table size="small">
                        <TableBody>
                          {CATEGORY_ORDER.map((category) => {
                            const amount = insights.categoryTotals[category];
                            const share =
                              insights.monthlyIncome > 0
                                ? Math.min(
                                    (amount / insights.monthlyIncome) * 100,
                                    999,
                                  )
                                : 0;

                            return (
                              <TableRow key={category} hover>
                                <TableCell>
                                  <Typography
                                    variant="body2"
                                    fontWeight={700}
                                    sx={{ color: CATEGORY_COLORS[category] }}
                                  >
                                    {CATEGORY_LABELS[category]}
                                  </Typography>
                                </TableCell>
                                <TableCell align="right">
                                  <Typography variant="body2">
                                    {formatCurrency(amount)}
                                  </Typography>
                                </TableCell>
                                <TableCell align="right">
                                  <Typography
                                    variant="body2"
                                    color="text.secondary"
                                  >
                                    {share.toFixed(0)}% of income
                                  </Typography>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </Paper>
                  </Stack>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card>
            <CardHeader
              title="Sankey Section"
              subheader="Money flows from Net Income into optional user-defined path layers and then into the final expense leaves."
              titleTypographyProps={{ variant: "subtitle1", fontWeight: 700 }}
              subheaderTypographyProps={{ variant: "caption" }}
              sx={SECTION_HEADER_SX}
            />
            <Divider />
            <CardContent sx={SECTION_CONTENT_SX}>
              <Box display="flex" flexWrap="wrap" gap={1} mb={2}>
                <Chip label="Expenses Branch from Net Income" size="small" />
                <Chip label={"Use '>' for Nested Path Layers"} size="small" />
                <Chip
                  label="Expense Name Becomes the Final Leaf"
                  size="small"
                />
              </Box>
              <SankeyChart data={insights.sankeyData} />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Dialog
        open={instructionsOpen}
        onClose={() => setInstructionsOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Sankey Path Instructions</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2}>
            <Typography variant="body2" color="text.secondary">
              The Sankey diagram flows from <strong>Net Income</strong> into
              optional user-defined path layers and then into the final expense
              leaf. Use the <strong>Sankey Path</strong> field to specify one or
              more nested layers.
            </Typography>

            <Typography variant="subtitle2" fontWeight={700}>
              How to write a Sankey Path
            </Typography>

            <Box component="ul" sx={{ pl: 2.5, m: 0 }}>
              <Typography component="li" variant="body2" sx={{ mb: 1 }}>
                Separate nested layers with{" "}
                <Box component="span" sx={{ fontFamily: "monospace" }}>
                  {" > "}
                </Box>{" "}
                (greater-than sign).
              </Typography>
              <Typography component="li" variant="body2" sx={{ mb: 1 }}>
                Do not include the expense name in the path; the{" "}
                <strong>Expense</strong> column is the final leaf.
              </Typography>
            </Box>

            <Typography variant="subtitle2" fontWeight={700}>
              Examples
            </Typography>

            <Box
              component="pre"
              sx={{
                fontFamily: "monospace",
                backgroundColor: (theme) => theme.palette.action.hover,
                p: 1,
                borderRadius: 1,
                whiteSpace: "pre-wrap",
                mb: 1,
              }}
            >{`Example 1:
Sankey Path: Subscriptions > AI Tools
Expense: Copilot
Resulting flow: Net Income → Subscriptions → AI Tools → Copilot

Example 2:
Sankey Path: Home > Security
Expense: Ring
Resulting flow: Net Income → Home → Security → Ring

Example 3 (no path):
Sankey Path: (blank)
Expense: Internet
Resulting flow: Net Income → Internet`}</Box>

            <Typography variant="body2" color="text.secondary">
              Tip: Category still controls pie-chart colors and summaries. Paths
              control Sankey structure only.
            </Typography>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setInstructionsOpen(false)}>Got It</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
