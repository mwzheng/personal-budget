'use client';
import React, { useState } from 'react';
import { Box, TextField, Button, Stack } from '@mui/material';

type Goal = {
  goalId?: string;
  name: string;
  targetAmount: number;
  currentSaved?: number;
  monthlyContribution?: number;
  expectedAnnualReturn?: number;
};

export default function GoalForm({ defaultGoal, onSaved, onCancel } : { defaultGoal?: Goal; onSaved?: (g:any)=>void; onCancel?: ()=>void }) {
  const [name, setName] = useState(defaultGoal?.name ?? '');
  const [targetAmount, setTargetAmount] = useState(String(defaultGoal?.targetAmount ?? ''));
  const [currentSaved, setCurrentSaved] = useState(String(defaultGoal?.currentSaved ?? ''));
  const [monthlyContribution, setMonthlyContribution] = useState(String(defaultGoal?.monthlyContribution ?? ''));
  const [expectedAnnualReturn, setExpectedAnnualReturn] = useState(String(defaultGoal?.expectedAnnualReturn ?? ''));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const body = {
        goalId: defaultGoal?.goalId,
        name,
        targetAmount: Number(targetAmount),
        currentSaved: Number(currentSaved),
        monthlyContribution: Number(monthlyContribution),
        expectedAnnualReturn: Number(expectedAnnualReturn),
      };
      const res = await apiFetch('/api/goals', {
        method: defaultGoal?.goalId ? 'PUT' : 'POST',
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
    <Box component="form" onSubmit={submit} sx={{ maxWidth: 680 }}>
      <Stack spacing={2}>
        <TextField label="Name" value={name} onChange={(e)=>setName(e.target.value)} required />
        <TextField label="Target Amount" value={targetAmount} onChange={(e)=>setTargetAmount(e.target.value)} type="number" required />
        <TextField label="Current Saved" value={currentSaved} onChange={(e)=>setCurrentSaved(e.target.value)} type="number" />
        <TextField label="Monthly Contribution" value={monthlyContribution} onChange={(e)=>setMonthlyContribution(e.target.value)} type="number" />
        <TextField label="Expected Annual Return (decimal, e.g., 0.05)" value={expectedAnnualReturn} onChange={(e)=>setExpectedAnnualReturn(e.target.value)} type="number" />
        <Stack direction="row" spacing={2}>
          <Button variant="contained" type="submit" disabled={loading}>{defaultGoal?.goalId ? 'Update' : 'Create'}</Button>
          <Button variant="outlined" onClick={onCancel}>Cancel</Button>
        </Stack>
        {error && <Box sx={{ color: 'error.main' }}>{error}</Box>}
      </Stack>
    </Box>
  );
}
