"use client";

// Note 1: HistoryTabs consolidates RetirementList and SalaryList into a single
// tabbed panel. Both panels stay mounted (hidden via CSS display) to avoid
// re-fetch churn and state loss when switching tabs — each list owns its own
// CRUD state and dialog visibility that would reset on unmount.

import React, { useState } from "react";
import { Box, Tab, Tabs } from "@mui/material";
import RetirementList from "@/components/ui/RetirementList";
import SalaryList from "@/components/ui/SalaryList";

const TAB_RETIREMENT = 0;
const TAB_SALARY = 1;

interface Props {
  onEntriesChanged?: () => void | Promise<void>;
}

export default function HistoryTabs({ onEntriesChanged }: Props) {
  const [activeTab, setActiveTab] = useState(TAB_RETIREMENT);

  return (
    <Box>
      <Tabs
        value={activeTab}
        onChange={(_, newValue: number) => setActiveTab(newValue)}
        variant="scrollable"
        scrollButtons="auto"
        sx={{
          mb: 3,
          minHeight: 40,
          bgcolor: "background.paper",
          borderRadius: 1,
          p: 0.5,
          "& .MuiTabs-indicator": { display: "none" },
          "& .MuiTab-root": {
            minHeight: 36,
            borderRadius: 0.75,
            textTransform: "none",
            fontWeight: 500,
            "&.Mui-selected": {
              bgcolor: "action.selected",
              color: "text.primary",
            },
          },
        }}
      >
        <Tab
          label="Retirement"
          id="history-tab-0"
          aria-controls="history-panel-0"
        />
        <Tab
          label="Salary"
          id="history-tab-1"
          aria-controls="history-panel-1"
        />
      </Tabs>

      {/* Note 2: display:none keeps both panels mounted so CRUD state, open
          dialogs, and fetched data survive tab switches. */}
      <Box
        role="tabpanel"
        id="history-panel-0"
        aria-labelledby="history-tab-0"
        sx={{ display: activeTab === TAB_RETIREMENT ? "block" : "none" }}
      >
        <RetirementList onEntriesChanged={onEntriesChanged} />
      </Box>

      <Box
        role="tabpanel"
        id="history-panel-1"
        aria-labelledby="history-tab-1"
        sx={{ display: activeTab === TAB_SALARY ? "block" : "none" }}
      >
        <SalaryList onEntriesChanged={onEntriesChanged} />
      </Box>
    </Box>
  );
}
