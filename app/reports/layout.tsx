import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Reports",
  description:
    "Review transactions, charts, and category totals from one spending dashboard.",
};

const Layout = ({ children }: { children: React.ReactNode }) => {
  return children;
};

export default Layout;
