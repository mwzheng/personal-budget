import type { Metadata } from "next";
import { AppNav } from "@/components/AppNav";
import { Providers } from "./providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "Personal Budget",
  description: "Track and analyze your personal spending",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <AppNav />
          {children}
        </Providers>
      </body>
    </html>
  );
}
