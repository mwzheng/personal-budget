import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign out",
  description: "Clear local session state and safely end the current session.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
