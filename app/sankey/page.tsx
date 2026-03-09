// Note 1: `"use client"` is required because this page uses `useState` and
// event handlers. Next.js App Router renders components on the server by default;
// the directive opts this entire module into client-side execution.
"use client";

import { apiFetch } from "../../lib/apiFetch";

import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardHeader from "@mui/material/CardHeader";
import Container from "@mui/material/Container";
import Divider from "@mui/material/Divider";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import Skeleton from "@mui/material/Skeleton";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import dynamic from "next/dynamic";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

import { SankeyForm } from "@/components/budget/SankeyForm";
import { SankeyResponse } from "@/lib/types";
import { BudgetForm } from "@/components/budget/BudgetForm";
import { BudgetList } from "@/components/budget/BudgetList";

// Note 2: `dynamic(..., { ssr: false })` defers loading the SankeyChart bundle
// to the browser. Nivo's Sankey chart relies on DOM APIs (SVG measurements)
// that are unavailable during server-side rendering. Without `ssr: false`, the
// server render would throw. The `loading` fallback renders a Skeleton while
// the bundle downloads, keeping the page visually stable.
const SankeyChart = dynamic(
  () => import("@/components/charts/SankeyChart").then((m) => m.SankeyChart),
  {
    ssr: false,
    loading: () => <Skeleton variant="rectangular" height={420} />,
  },
);

const CATEGORY_COLORS: Record<string, string> = {
  Need: "#ef5350",
  Want: "#42a5f5",
  Saving: "#66bb6a",
};

export default function SankeyPage() {
  const [result, setResult] = useState<SankeyResponse | null>(null);
  const [selectedBudget, setSelectedBudget] = useState<any | null>(null);
  const [budgetsReloadKey, setBudgetsReloadKey] = useState(0);

  // Note N: Client-side auth guard — ensures unauthenticated users are
  // redirected to the login page. This is a pragmatic client-only check;
  // for stronger protection add Next.js `middleware.ts` for server-side redirect.
  const router = useRouter();
  useEffect(() => {
    try {
      if (process.env.NEXT_PUBLIC_DISABLE_AUTH === "true") return;
      const hasToken =
        typeof window !== "undefined" &&
        (sessionStorage.getItem("access_token") ||
          sessionStorage.getItem("id_token"));
      if (!hasToken) {
        router.replace("/auth/login");
      }
    } catch {
      // swallow errors; don't break the page if storage access fails
      // (e.g., in strict privacy modes).
    }
  }, [router]);

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Typography variant="h4" fontWeight={700} mb={1}>
        Budget Generator
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={4}>
        Enter your monthly income and set how to allocate it across needs,
        wants, and savings. The Sankey diagram visualises your money flow.
      </Typography>

      <Grid container spacing={3}>
        {/* Left: form */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardHeader
              title="Configure Budget"
              subheader="Uses the 50/30/20 rule as default"
              titleTypographyProps={{ variant: "subtitle1", fontWeight: 600 }}
              subheaderTypographyProps={{ variant: "caption" }}
            />
            <Divider />
            <CardContent>
              <SankeyForm onResult={setResult} />
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                Saved Budgets
              </Typography>
              <Box>
                <Box mb={2}>
                  {/* BudgetForm now accepts `initialBudget` so it can be used for
                      both create and edit flows. onSaved triggers a list refresh */}
                  <BudgetForm
                    initialBudget={selectedBudget ?? undefined}
                    onSaved={() => {
                      setSelectedBudget(null);
                      setBudgetsReloadKey((k) => k + 1);
                    }}
                    onCancel={() => setSelectedBudget(null)}
                  />
                </Box>
                <Box>
                  {/* BudgetList supports selection and an explicit edit action. */}
                  {/* @ts-ignore */}
                  <BudgetList
                    reloadKey={budgetsReloadKey}
                    onSelect={(b: any) => {
                      (async () => {
                        const resp = await apiFetch("/api/sankey", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ allocations: b.allocations }),
                        });
                        const data = await resp.json();
                        setResult(data);
                      })();
                    }}
                    onEdit={(b: any) => setSelectedBudget(b)}
                  />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Right: chart + suggestion */}
        <Grid item xs={12} md={8}>
          <Box display="flex" flexDirection="column" gap={3}>
            {/* Sankey diagram */}
            <Card>
              <CardHeader
                title="Budget Flow"
                subheader="Income -> category allocation"
                titleTypographyProps={{ variant: "subtitle1", fontWeight: 600 }}
                subheaderTypographyProps={{ variant: "caption" }}
              />
              <Divider />
              <CardContent>
                <SankeyChart
                  data={result?.sankeyData ?? { nodes: [], links: [] }}
                />
              </CardContent>
            </Card>

            {/* Budget suggestion table */}
            {result && (
              <Card>
                <CardHeader
                  title="Monthly Budget Breakdown"
                  titleTypographyProps={{
                    variant: "subtitle1",
                    fontWeight: 600,
                  }}
                />
                <Divider />
                <CardContent>
                  <Paper variant="outlined">
                    <Table size="small">
                      <TableBody>
                        {Object.entries(result.budgetSuggestion).map(
                          ([category, amount]) => (
                            <TableRow key={category} hover>
                              <TableCell>
                                <Typography
                                  variant="body2"
                                  fontWeight={600}
                                  sx={{
                                    color:
                                      CATEGORY_COLORS[category] ??
                                      "text.primary",
                                  }}
                                >
                                  {category}
                                </Typography>
                              </TableCell>
                              <TableCell align="right">
                                <Typography variant="body2">
                                  ${amount.toLocaleString()}/month
                                </Typography>
                              </TableCell>
                              <TableCell align="right">
                                {/* Note 5: The percentage is computed on the fly by
                                    dividing each category's amount by the running
                                    total of all categories. This avoids storing a
                                    separate percentage field on the server response. */}
                                <Typography
                                  variant="body2"
                                  color="text.secondary"
                                >
                                  {(
                                    (amount /
                                      Object.values(
                                        result.budgetSuggestion,
                                      ).reduce((s, v) => s + v, 0)) *
                                    100
                                  ).toFixed(0)}
                                  %
                                </Typography>
                              </TableCell>
                            </TableRow>
                          ),
                        )}
                        <TableRow sx={{ bgcolor: "action.hover" }}>
                          <TableCell>
                            <Typography variant="body2" fontWeight={700}>
                              Total
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2" fontWeight={700}>
                              $
                              {Object.values(result.budgetSuggestion)
                                .reduce((s, v) => s + v, 0)
                                .toLocaleString()}
                              /month
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography
                              variant="body2"
                              fontWeight={700}
                              color="success.main"
                            >
                              100%
                            </Typography>
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </Paper>
                </CardContent>
              </Card>
            )}
          </Box>
        </Grid>
      </Grid>
    </Container>
  );
}
