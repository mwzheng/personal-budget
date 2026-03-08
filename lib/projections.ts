export type ProjectionPoint = { month: number; date: string; balance: number };

export function computeProjection(currentSaved: number, monthlyContribution: number, annualReturn: number, months: number): ProjectionPoint[] {
  const monthlyRate = annualReturn && annualReturn > 0 ? Math.pow(1 + annualReturn, 1 / 12) - 1 : 0;
  let balance = currentSaved;
  const now = new Date();
  const points: ProjectionPoint[] = [];
  for (let i = 1; i <= months; i++) {
    balance = balance * (1 + monthlyRate) + monthlyContribution;
    const d = new Date(now.getFullYear(), now.getMonth() + i, now.getDate());
    points.push({ month: i, date: d.toISOString(), balance: Math.round(balance * 100) / 100 });
  }
  return points;
}

export function projectYears(currentSaved: number, monthlyContribution: number, annualReturn: number, years: number) {
  return computeProjection(currentSaved, monthlyContribution, annualReturn, Math.max(1, Math.round(years * 12)));
}
