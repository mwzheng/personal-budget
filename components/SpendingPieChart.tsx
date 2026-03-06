'use client';

import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';

const COLORS: Record<string, string> = {
  Need: '#ef5350',
  Want: '#42a5f5',
  Saving: '#66bb6a',
};

interface Props {
  data: { Need: number; Want: number; Saving: number };
}

export function SpendingPieChart({ data }: Props) {
  const chartData = [
    { name: 'Need', value: data.Need },
    { name: 'Want', value: data.Want },
    { name: 'Saving', value: data.Saving },
  ].filter((d) => d.value > 0);

  if (chartData.length === 0) {
    return (
      <div
        style={{ textAlign: 'center', padding: 40, color: '#666', height: 280 }}
      >
        No data for selected filters
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie
          data={chartData}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          outerRadius={100}
          innerRadius={50}
          paddingAngle={2}
          label={({ name, percent }) =>
            `${name} ${(percent * 100).toFixed(0)}%`
          }
          labelLine={false}
        >
          {chartData.map((entry) => (
            <Cell key={entry.name} fill={COLORS[entry.name]} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value: number) => [
            `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
            '',
          ]}
          contentStyle={{ background: '#242424', border: '1px solid #444' }}
        />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}
