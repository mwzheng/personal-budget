import type { Metadata } from "next";
import Container from "@mui/material/Container";
import SalaryList from "@/components/ui/SalaryList";

export const metadata: Metadata = {
  title: "Salary history",
  description:
    "Store yearly salary entries and compare income changes over time.",
};

export default function Page() {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <SalaryList />
    </Container>
  );
}
