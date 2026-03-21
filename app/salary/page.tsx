import type { Metadata } from "next";
import Container from "@mui/material/Container";
import SalaryList from "@/components/ui/SalaryList";

export const metadata: Metadata = {
  title: "Salary history",
  description:
    "Review annual salary history, add new entries, and compare income growth over time.",
};

export default function Page() {
  // Note 1: SalaryList renders the page content and controls, while this route
  // wrapper supplies the top-level main landmark and the wider authenticated layout.
  return (
    <Container
      component="main"
      maxWidth="xl"
      aria-label="Salary history"
      sx={{ py: 4 }}
    >
      <SalaryList />
    </Container>
  );
}
