'use client';
import React from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export default function ProjectionChart({ data }: { data: { month: number; date: string; balance: number }[] }) {
  if (!data || data.length === 0) return null;
  const chartData = data.map((d) => ({ name: new Date(d.date).toLocaleDateString(), balance: d.balance }));
  return (
    <div style={{ width: '100%', height: 320 }}>
      <ResponsiveContainer>
        <LineChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" minTickGap={20} />
          <YAxis />
          <Tooltip formatter={(value: any) => `$${Number(value).toLocaleString()}`} />
          <Line type="monotone" dataKey="balance" stroke="#3f51b5" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
