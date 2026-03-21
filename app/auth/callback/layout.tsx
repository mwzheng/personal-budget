import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Completing sign in",
  description:
    "Finish the authentication flow and return the user to the budgeting app.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
