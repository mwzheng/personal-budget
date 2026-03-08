"use client";
import React, { useState } from "react";
import ProjectionForm from "./ProjectionForm";
import ProjectionChart from "./ProjectionChart";

function computeProjectionLocal(
  currentSaved: number,
  monthlyContribution: number,
  annualReturn: number,
  years: number,
) {
  const months = Math.max(1, Math.round(years * 12));
  const monthlyRate =
    annualReturn && annualReturn > 0
      ? Math.pow(1 + annualReturn, 1 / 12) - 1
      : 0;
  let balance = currentSaved;
  const now = new Date();
  const points = [] as { month: number; date: string; balance: number }[];
  for (let i = 1; i <= months; i++) {
    balance = balance * (1 + monthlyRate) + monthlyContribution;
    const d = new Date(now.getFullYear(), now.getMonth() + i, now.getDate());
    points.push({
      month: i,
      date: d.toISOString(),
      balance: Math.round(balance * 100) / 100,
    });
  }
  return points;
}

export default function ProjectionView() {
  const [data, setData] = useState<
    { month: number; date: string; balance: number }[]
  >([]);

  const handleGenerate = (params: {
    currentSaved: number;
    monthlyContribution: number;
    annualReturn: number;
    years: number;
  }) => {
    const pts = computeProjectionLocal(
      params.currentSaved,
      params.monthlyContribution,
      params.annualReturn,
      params.years,
    );
    setData(pts);
  };

  return (
    <div>
      <ProjectionForm onGenerate={handleGenerate} />
      <ProjectionChart data={data} />
    </div>
  );
}
