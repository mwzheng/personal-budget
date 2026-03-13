"use client";
import React from "react";
import Container from "@mui/material/Container";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Divider from "@mui/material/Divider";
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

      <Paper sx={{ p: 2, mb: 3 }} elevation={1}>
        <GoalEditor />
      </Paper>

      <Divider sx={{ mb: 3 }} />

      <Paper sx={{ p: 2, mb: 3 }} elevation={1}>
        <ProgressCharts />
      </Paper>

      <Divider sx={{ mb: 3 }} />

      <Paper sx={{ p: 2, mb: 3 }} elevation={1}>
        <RetirementList />
      </Paper>

      <Divider sx={{ mb: 3 }} />

      <Paper sx={{ p: 2, mb: 3 }} elevation={1}>
        <MilestonesList />
      </Paper>

      <Divider sx={{ mb: 3 }} />

      <Paper sx={{ p: 2 }} elevation={1}>
        <SalaryList />
      </Paper>
    </Container>
  );
}
