"use client";
import React from "react";
import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import RetirementList from "@/components/ui/RetirementList";
import MilestonesList from "@/components/progress/MilestonesList";
import GoalEditor from "@/components/progress/GoalEditor";
import ProgressCharts from "@/components/progress/ProgressCharts";
import SalaryList from "@/components/ui/SalaryList";

export default function Page() {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        Progress Tracker
      </Typography>

      <ProgressCharts />

      <Grid container spacing={3} sx={{ mt: 3 }}>
        <Grid item xs={12} md={6}>
          <RetirementList />
        </Grid>
        <Grid item xs={12} md={6}>
          <MilestonesList />
        </Grid>
        <Grid item xs={12} md={6}>
          <GoalEditor />
        </Grid>
      </Grid>

      <Box sx={{ mt: 3 }}>
        <SalaryList />
      </Box>
    </Container>
  );
}
