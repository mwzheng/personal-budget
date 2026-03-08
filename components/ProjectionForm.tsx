'use client';
import React, { useState } from 'react';
import { Box, TextField, Button, Stack } from '@mui/material';

export default function ProjectionForm({ onGenerate }: { onGenerate: (params: { currentSaved: number; monthlyContribution: number; annualReturn: number; years: number }) => void }) {
  const [currentSaved, setCurrentSaved] = useState('0');
  const [monthlyContribution, setMonthlyContribution] = useState('500');
  const [annualReturn, setAnnualReturn] = useState('0.05');
  const [years, setYears] = useState('10');

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    onGenerate({ currentSaved: Number(currentSaved), monthlyContribution: Number(monthlyContribution), annualReturn: Number(annualReturn), years: Number(years) });
  };

  return (
    <Box component="form" onSubmit={submit} sx={{ mb: 2 }}>
      <Stack spacing={2}>
        <TextField label="Current Saved" value={currentSaved} onChange={(e) => setCurrentSaved(e.target.value)} type="number" />
        <TextField label="Monthly Contribution" value={monthlyContribution} onChange={(e) => setMonthlyContribution(e.target.value)} type="number" />
        <TextField label="Expected Annual Return (decimal, e.g., 0.05)" value={annualReturn} onChange={(e) => setAnnualReturn(e.target.value)} type="number" />
        <TextField label="Projection Horizon (years)" value={years} onChange={(e) => setYears(e.target.value)} type="number" />
        <Stack direction="row" spacing={2}>
          <Button variant="contained" type="submit">Generate</Button>
        </Stack>
      </Stack>
    </Box>
  );
}
