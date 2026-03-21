import type { Metadata } from "next";
import Container from "@mui/material/Container";
import GoalList from "@/components/ui/GoalList";

export const metadata: Metadata = {
  title: "Goals",
  description:
    "Track savings targets and review the milestones that matter over time.",
};
export default function Page() {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <GoalList />
    </Container>
  );
}
