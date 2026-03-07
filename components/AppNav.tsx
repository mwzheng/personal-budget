"use client";

import AppBar from "@mui/material/AppBar";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import NextLink from "next/link";
import { usePathname } from "next/navigation";

export function AppNav() {
  const pathname = usePathname();
  const value = pathname.startsWith("/sankey") ? "sankey" : "reports";

  return (
    <AppBar
      position="static"
      elevation={0}
      sx={{ borderBottom: "1px solid #333", bgcolor: "#1a1a1a" }}
    >
      <Toolbar>
        <Typography variant="h6" sx={{ mr: 4, fontWeight: 700 }}>
          💰 Personal Budget
        </Typography>
        <Tabs value={value} textColor="inherit" indicatorColor="primary">
          <Tab
            label="Reports"
            value="reports"
            component={NextLink}
            href="/reports"
          />
          <Tab
            label="Budget Generator"
            value="sankey"
            component={NextLink}
            href="/sankey"
          />
        </Tabs>
      </Toolbar>
    </AppBar>
  );
}
