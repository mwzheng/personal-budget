/**
 * Note N: Public home page for unauthenticated users. Signed-in users are
 * redirected to /reports using client-side tokens in sessionStorage. For
 * server-side enforcement, consider adding `middleware.ts`.
 */

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";

export default function Home() {
  const router = useRouter();
  useEffect(() => {
    try {
      if (process.env.NEXT_PUBLIC_DISABLE_AUTH === "true") return;
      const hasToken =
        typeof window !== "undefined" &&
        (sessionStorage.getItem("access_token") ||
          sessionStorage.getItem("id_token"));
      if (hasToken) {
        router.replace("/reports");
      }
    } catch (e) {
      // ignore storage errors
    }
  }, [router]);

  return (
    <Container maxWidth="md" sx={{ py: 8 }}>
      <Typography variant="h3" component="h1" gutterBottom>
        Personal Budget
      </Typography>
      <Typography variant="h6" color="text.secondary" paragraph>
        Track income, plan budgets, and visualise spending with interactive
        reports and a budget generator.
      </Typography>

      <Grid container spacing={2} sx={{ mt: 4 }}>
        <Grid item xs={12} md={6}>
          <Paper variant="outlined" sx={{ p: 3 }}>
            <Typography variant="h6">Transactions</Typography>
            <Typography variant="body2" color="text.secondary">
              Import and view your transactions to get accurate spending
              reports.
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper variant="outlined" sx={{ p: 3 }}>
            <Typography variant="h6">Budgets</Typography>
            <Typography variant="body2" color="text.secondary">
              Create, save, and apply budgets to analyse how well you're
              sticking to your plan.
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper variant="outlined" sx={{ p: 3 }}>
            <Typography variant="h6">Reports</Typography>
            <Typography variant="body2" color="text.secondary">
              Visualise spending over time and by category with charts and
              tables.
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper variant="outlined" sx={{ p: 3 }}>
            <Typography variant="h6">Budget Generator</Typography>
            <Typography variant="body2" color="text.secondary">
              Try the Sankey budget generator to explore allocation strategies.
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      <Box sx={{ mt: 4, display: "flex", gap: 2 }}>
        <Button variant="contained" component={Link} href="/auth/login">
          Sign in / Register
        </Button>
        <Button variant="outlined" component={Link} href="/reports">
          View reports
        </Button>
        <Button variant="outlined" component={Link} href="/sankey">
          Budget generator
        </Button>
      </Box>
    </Container>
  );
}
