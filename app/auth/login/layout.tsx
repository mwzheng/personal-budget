import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign in",
  description:
    "Sign in to review budgets, reports, goals, and other personal finance progress.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
