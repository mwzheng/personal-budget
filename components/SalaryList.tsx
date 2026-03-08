// Note 1: SalaryList is the top-level orchestrator for the salary history page.
// It manages the list of entries, the add/edit form visibility, and the
// SalaryChart. Splitting into List, Form, and Chart sub-components keeps each
// piece focused and independently testable.
"use client";
import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  List,
  ListItem,
  ListItemText,
  Typography,
  Stack,
  Divider,
} from "@mui/material";
import SalaryForm from "./SalaryForm";
import SalaryChart from "./SalaryChart";

export default function SalaryList() {
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  // Note 2: `editing` holds the full salary object being edited, or `null` when
  // the form is in "create new" mode. Passing it as `defaultEntry` pre-fills the
  // SalaryForm fields when the user clicks Edit.
  const [editing, setEditing] = useState<any | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEntries = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch("/api/salary");
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "Failed to load");
      setEntries(data.entries ?? []);
    } catch (err: any) {
      setError(err.message || String(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEntries();
  }, []);

  const handleSaved = (e: any) => {
    // Note 3: After a successful save the form is dismissed and the list is
    // re-fetched. Re-fetching from the server guarantees the list reflects the
    // freshly stored data (including any server-computed YoY values).
    setShowForm(false);
    setEditing(null);
    fetchEntries();
  };

  const handleDelete = async (entryId?: string, year?: number) => {
    if (!entryId || !year) return;
    if (!confirm("Delete this salary entry?")) return;
    try {
      // Note 4: Year is required in the query string alongside entryId because
      // the DynamoDB sort key encodes both: "salary#<year>#<entryId>". Without
      // the year the server cannot reconstruct the sort key to delete the item.
      const res = await apiFetch(
        "/api/salary?entryId=" +
          encodeURIComponent(entryId) +
          "&year=" +
          encodeURIComponent(String(year)),
        { method: "DELETE" },
      );
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "Delete failed");
      fetchEntries();
    } catch (err: any) {
      setError(err.message || String(err));
    }
  };

  return (
    <Box>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{ mb: 2 }}
      >
        <Typography variant="h4">Salary History</Typography>
        <Button
          variant="contained"
          onClick={() => {
            setEditing(null);
            setShowForm(true);
          }}
        >
          Add Entry
        </Button>
      </Stack>

      {showForm && (
        <Box sx={{ mb: 2 }}>
          <SalaryForm
            defaultEntry={editing || undefined}
            onSaved={handleSaved}
            onCancel={() => {
              setShowForm(false);
              setEditing(null);
            }}
          />
        </Box>
      )}

      {error && <Box sx={{ color: "error.main", mb: 2 }}>{error}</Box>}

      <SalaryChart data={entries} />

      <List>
        {entries.map((e) => (
          <React.Fragment key={e.entryId}>
            <ListItem
              secondaryAction={
                <Stack direction="row" spacing={1}>
                  <Button
                    size="small"
                    onClick={() => {
                      setEditing(e);
                      setShowForm(true);
                    }}
                  >
                    Edit
                  </Button>
                  <Button
                    size="small"
                    color="error"
                    onClick={() => handleDelete(e.entryId, e.year)}
                  >
                    Delete
                  </Button>
                </Stack>
              }
            >
              <ListItemText
                primary={`${e.year} — $${Number(e.amount).toLocaleString()}`}
                secondary={e.yoy !== null ? `YoY: ${e.yoy}%` : ""}
              />
            </ListItem>
            <Divider component="li" />
          </React.Fragment>
        ))}
      </List>

      {entries.length === 0 && !loading && (
        <Typography>No salary history yet.</Typography>
      )}
    </Box>
  );
}
