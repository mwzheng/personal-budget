// Note 1: BudgetList fetches all saved budgets on mount and renders them as a
// selectable, deletable list. The `onSelect` callback lets the parent page
// (SankeyPage) receive the chosen budget and pass its allocations to the
// SankeyChart -- this is the "lifting state up" React pattern.
"use client";

import React, { useEffect, useState } from "react";
import { apiFetch } from "../lib/apiFetch";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import ListItemSecondaryAction from "@mui/material/ListItemSecondaryAction";
import IconButton from "@mui/material/IconButton";
import Button from "@mui/material/Button";
import DeleteIcon from "@mui/icons-material/Delete";

export function BudgetList({ onSelect }: { onSelect?: (budget: any) => void }) {
  const [budgets, setBudgets] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await apiFetch("/api/budgets");

      // Read the body as text and attempt to parse JSON. This is safer than
      // calling res.json() unconditionally because some error responses may
      // be non-JSON and calling json() would throw.
      const text = await res.text();
      let data: any = null;
      try {
        data = text ? JSON.parse(text) : null;
      } catch (e) {
        // ignore parse errors; we'll fall back to statusText
      }

      if (!res.ok) {
        const msg =
          data?.error?.message ||
          data?.message ||
          res.statusText ||
          "Request failed";
        // If unauthorized, clear stored tokens and redirect to the auth flow
        // so the user can re-authenticate instead of showing a console error.
        if (res.status === 401 || res.status === 403) {
          if (typeof window !== "undefined") {
            try {
              window.sessionStorage.removeItem("access_token");
              window.sessionStorage.removeItem("id_token");
              window.sessionStorage.removeItem("refresh_token");
            } catch (e) {
              // ignore storage errors
            }

            // Prefer redirecting to the configured Cognito hosted UI if envs
            // are available, otherwise fall back to a local /login page.
            const domain =
              (process.env.NEXT_PUBLIC_COGNITO_DOMAIN as string) || undefined;
            const clientId =
              (process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID as string) ||
              undefined;
            const redirectUri = window.location.origin;

            if (domain && clientId) {
              const loginUrl = `${domain}/login?client_id=${encodeURIComponent(
                clientId,
              )}&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}`;
              window.location.href = loginUrl;
              return;
            }

            window.location.href = "/login";
            return;
          }
        }

        throw new Error(msg);
      }

      setBudgets(data || []);
    } catch (err) {
      console.error("Failed to load budgets", err);
      setBudgets([]);
    } finally {
      setLoading(false);
    }
  }

  // Note 2: `useEffect(() => { ... }, [])` with an empty dependency array runs
  // exactly once after the component first renders -- the equivalent of
  // `componentDidMount` in class components. This is the correct place to
  // initiate an initial data fetch.
  useEffect(() => {
    load();
  }, []);

  async function handleDelete(id: string) {
    if (!confirm("Delete this budget?")) return;
    try {
      const res = await apiFetch(`/api/budgets/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      // Note 3: Instead of calling `load()` again (another network round-trip),
      // the deleted budget is removed optimistically from local state with
      // `filter`. This keeps the UI snappy and avoids a flicker from re-fetching.
      setBudgets((s) => s.filter((b) => b.budgetId !== id));
    } catch (err) {
      console.error(err);
      alert("Failed to delete budget");
    }
  }

  return (
    <div>
      <List dense>
        {loading && <div>Loading budgets…</div>}
        {budgets.map((b) => (
          // Note 4: Use `ListItemButton` inside `ListItem` in MUI v6 instead of
          // the removed `button` prop on `ListItem`. This keeps keyboard and
          // focus behavior while matching the updated type definitions.
          <ListItem key={b.budgetId}>
            <ListItemButton onClick={() => onSelect?.(b)}>
              <ListItemText
                primary={b.name}
                secondary={
                  b.allocations
                    ? b.allocations
                        .map((a: any) => `${a.category}: ${a.amount}`)
                        .join(", ")
                    : ""
                }
              />
            </ListItemButton>
            <ListItemSecondaryAction>
              <Button size="small" onClick={() => onSelect?.(b)}>
                Select
              </Button>
              <IconButton edge="end" onClick={() => handleDelete(b.budgetId)}>
                <DeleteIcon />
              </IconButton>
            </ListItemSecondaryAction>
          </ListItem>
        ))}
      </List>
    </div>
  );
}
