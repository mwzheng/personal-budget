import type { Metadata } from "next";
import Box from "@mui/material/Box";

export const metadata: Metadata = {
  title: "Reports",
  description:
    "Review transactions, charts, and category totals from one spending dashboard.",
};

const Layout = ({ children }: { children: React.ReactNode }) => {
  // Report visualizations may render fixed-size SVG/table internals. Keep any
  // accidental paint overflow inside this route; intentional table scrolling is
  // handled by its own local scroll region.
  return (
    <Box
      className="reports-route"
      sx={{
        width: "100%",
        minWidth: 0,
        maxWidth: "100%",
        overflow: "clip",
      }}
    >
      {children}
    </Box>
  );
};

export default Layout;
