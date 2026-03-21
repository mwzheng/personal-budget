import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Progress",
  description:
    "Follow salary, retirement, and other longer-term financial progress in one place.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
