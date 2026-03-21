import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create account",
  description:
    "Create an account to start tracking money with a more intentional workflow.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
