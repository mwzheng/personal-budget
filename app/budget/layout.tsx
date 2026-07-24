import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Budget",
  description:
    "Plan named expenses and visualize a monthly budget with pie and Sankey charts.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
