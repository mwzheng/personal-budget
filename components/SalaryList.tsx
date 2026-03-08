'use client';
import React, { useEffect, useState } from 'react';
import { Box, Button, List, ListItem, ListItemText, Typography, Stack, Divider } from '@mui/material';
import SalaryForm from './SalaryForm';
import SalaryChart from './SalaryChart';

export default function SalaryList() {
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEntries = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/salary');
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || 'Failed to load');
      setEntries(data.entries ?? []);
    } catch (err: any) {
      setError(err.message || String(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(()=>{ fetchEntries(); }, []);

  const handleSaved = (e: any) => { setShowForm(false); setEditing(null); fetchEntries(); };

  const handleDelete = async (entryId?: string, year?: number) => {
    if (!entryId || !year) return;
    if (!confirm('Delete this salary entry?')) return;
    try {
      const res = await fetch('/api/salary?entryId='+encodeURIComponent(entryId)+'&year='+encodeURIComponent(String(year)), { method: 'DELETE' });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || 'Delete failed');
      fetchEntries();
    } catch (err: any) {
      setError(err.message || String(err));
    }
  };

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Typography variant="h4">Salary History</Typography>
        <Button variant="contained" onClick={()=>{ setEditing(null); setShowForm(true); }}>Add Entry</Button>
      </Stack>

      {showForm && <Box sx={{ mb: 2 }}><SalaryForm defaultEntry={editing || undefined} onSaved={handleSaved} onCancel={()=>{ setShowForm(false); setEditing(null); }} /></Box>}

      {error && <Box sx={{ color: 'error.main', mb: 2 }}>{error}</Box>}

      <SalaryChart data={entries} />

      <List>
        {entries.map((e) => (
          <React.Fragment key={e.entryId}>
            <ListItem secondaryAction={
              <Stack direction="row" spacing={1}>
                <Button size="small" onClick={()=>{ setEditing(e); setShowForm(true); }}>Edit</Button>
                <Button size="small" color="error" onClick={()=>handleDelete(e.entryId, e.year)}>Delete</Button>
              </Stack>
            }>
              <ListItemText
                primary={`${e.year} — $${Number(e.amount).toLocaleString()}`}
                secondary={e.yoy !== null ? `YoY: ${e.yoy}%` : ''}
              />
            </ListItem>
            <Divider component="li" />
          </React.Fragment>
        ))}
      </List>

      {entries.length === 0 && !loading && <Typography>No salary history yet.</Typography>}
    </Box>
  );
}
