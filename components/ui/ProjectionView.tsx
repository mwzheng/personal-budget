// Note 1: ProjectionView wires the form (user inputs) to the chart (output).
// It holds the computed projection data in state and re-computes whenever the
// form is submitted. The projection logic lives here rather than in the API
// to keep the workflow fully client-side and instant.
"use client";
import React, { useState } from "react";
import ProjectionForm from "@/components/forms/ProjectionForm";
import ProjectionChart from "@/components/charts/ProjectionChart";

// Note 2: `computeProjectionLocal` simulates month-by-month compound growth.
// Each month, the balance grows by `monthlyRate` (interest) plus the fixed
// contribution. This is the standard compound interest accumulation formula.
function computeProjectionLocal(
  currentSaved: number,
  monthlyContribution: number,
  annualReturn: number,
  years: number,
) {
  const months = Math.max(1, Math.round(years * 12));
  // Note 3: Converting the annual rate to a monthly rate requires the 12th root
  // of (1 + annualRate), not a simple division. For example, a 6% annual return
  // becomes ~0.487% per month (not 0.5%) because of the compounding effect.
  const monthlyRate =
    annualReturn && annualReturn > 0
      ? Math.pow(1 + annualReturn, 1 / 12) - 1
      : 0;
  let balance = currentSaved;
  const now = new Date();
  const points = [] as { month: number; date: string; balance: number }[];
  for (let i = 1; i <= months; i++) {
    // Note 4: The order matters here: interest is applied to the existing balance
    // BEFORE adding the new contribution (end-of-month contribution model).
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
