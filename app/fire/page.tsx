import type { Metadata } from "next";
import Container from "@mui/material/Container";
import FireCalculator from "@/components/fire/FireCalculator";

export const metadata: Metadata = {
  title: "FIRE Calculator",
  description:
    "Calculate your Financial Independence number, project investment growth, and compare retirement scenarios.",
};

export default function Page() {
  return (
    <Container
      component="main"
      maxWidth="xl"
      aria-label="FIRE calculator"
      sx={{ py: 4 }}
    >
      <FireCalculator />
    </Container>
  );
}
