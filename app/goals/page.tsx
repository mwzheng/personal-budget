import type { Metadata } from "next";
import Container from "@mui/material/Container";
import GoalList from "@/components/ui/GoalList";

export const metadata: Metadata = {
  title: "Goals",
  description:
    "Create savings goals, review target milestones, and track progress toward each target over time.",
};

export default function Page() {
  // Note 1: GoalList already owns the visible page heading and CRUD flow, so this
  // wrapper focuses on route-level metadata, landmark semantics, and page width.
  return (
    <Container
      component="main"
      maxWidth="xl"
      aria-label="Savings goals"
      sx={{ py: 4 }}
    >
      <GoalList />
    </Container>
  );
}
