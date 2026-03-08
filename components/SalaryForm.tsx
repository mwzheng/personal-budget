'use client';
import React, { useState } from 'react';
import { Box, TextField, Button, Stack } from '@mui/material';

export default function SalaryForm({ defaultEntry, onSaved, onCancel } : { defaultEntry?: any; onSaved?: (e:any)=>void; onCancel?: ()=>void }) {
  const [year, setYear] = useState(String(defaultEntry?.year ?? new Date().getFullYear()));
  const [amount, setAmount] = useState(String(defaultEntry?.amount ?? '0'));
  const [note, setNote] = useState(defaultEntry?.note ?? '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const body: any = { year: Number(year), amount: Number(amount), note };
      if (defaultEntry?.entryId) body.entryId = defaultEntry.entryId;
      const res = await apiFetch('/api/salary', {
        method: defaultEntry?.entryId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || 'Save failed');
      onSaved?.(data.created || data.updated);
    } catch (err: any) {
      setError(err.message || String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box component="form" onSubmit={submit} sx={{ maxWidth: 480 }}>
      <Stack spacing={2}>
        <TextField label="Year" value={year} onChange={(e)=>setYear(e.target.value)} required type="number" />
        <TextField label="Amount" value={amount} onChange={(e)=>setAmount(e.target.value)} required type="number" />
        <TextField label="Note" value={note} onChange={(e)=>setNote(e.target.value)} />
        <Stack direction="row" spacing={2}>
          <Button variant="contained" type="submit" disabled={loading}>{defaultEntry?.entryId ? 'Update' : 'Add'}</Button>
          <Button variant="outlined" onClick={onCancel}>Cancel</Button>
        </Stack>
        {error && <Box sx={{ color: 'error.main' }}>{error}</Box>}
      </Stack>
    </Box>
  );
}
