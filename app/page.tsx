/**
 * Note N: Public home page for unauthenticated users. Signed-in users are
 * redirected to /reports using client-side tokens in sessionStorage. For
 * server-side enforcement, consider adding `middleware.ts`.
 */

"use client";

import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import AutoGraphIcon from "@mui/icons-material/AutoGraph";
import BarChartIcon from "@mui/icons-material/BarChart";
import SavingsIcon from "@mui/icons-material/Savings";

export default function Home() {
  // Note N: Keep the home page public so users can always recover navigation
  // by returning to `/`, even when authentication state is stale.

  return (
    <Container maxWidth="md" sx={{ py: 8 }}>
      <Typography variant="h3" component="h1" gutterBottom align="center">
        Personal Budget
      </Typography>
      <Typography variant="h6" color="text.secondary" paragraph align="center">
        Track income, plan budgets, and visualise spending with interactive
        reports and a budget generator.
      </Typography>

      <Grid container spacing={2} sx={{ mt: 4 }}>
        <Grid item xs={12} md={6}>
          <Paper variant="outlined" sx={{ p: 3 }}>
            <Box sx={{ display: "flex", justifyContent: "center", mb: 2 }}>
              <ReceiptLongIcon color="primary" sx={{ fontSize: 40 }} />
            </Box>
            <Typography variant="h6" align="center">
              Transactions
            </Typography>
            <Typography variant="body2" color="text.secondary" align="center">
              Import and view your transactions to get accurate spending
              reports.
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper variant="outlined" sx={{ p: 3 }}>
            <Box sx={{ display: "flex", justifyContent: "center", mb: 2 }}>
              <SavingsIcon color="primary" sx={{ fontSize: 40 }} />
            </Box>
            <Typography variant="h6" align="center">
              Budgets
            </Typography>
            <Typography variant="body2" color="text.secondary" align="center">
              Create, save, and apply budgets to analyse how well you are
              sticking to your plan.
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper variant="outlined" sx={{ p: 3 }}>
            <Box sx={{ display: "flex", justifyContent: "center", mb: 2 }}>
              <BarChartIcon color="primary" sx={{ fontSize: 40 }} />
            </Box>
            <Typography variant="h6" align="center">
              Reports
            </Typography>
            <Typography variant="body2" color="text.secondary" align="center">
              Visualise spending over time and by category with charts and
              tables.
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper variant="outlined" sx={{ p: 3 }}>
            <Box sx={{ display: "flex", justifyContent: "center", mb: 2 }}>
              <AutoGraphIcon color="primary" sx={{ fontSize: 40 }} />
            </Box>
            <Typography variant="h6" align="center">
              Budget Generator
            </Typography>
            <Typography variant="body2" color="text.secondary" align="center">
              Try the Sankey budget generator to explore allocation strategies.
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Note N: Intentionally no quick-action auth buttons on this landing page. */}
    </Container>
  );
}
