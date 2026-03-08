import { NextResponse } from "next/server";

// Minimal transactions API stub. Replace with DynamoDB logic in the next tasks.
export async function GET(request: Request) {
  return NextResponse.json({ ok: true, message: "Transactions API stub (list)" });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  return NextResponse.json({ ok: true, message: "Transactions create stub", body });
}
