import { NextResponse } from "next/server";
import { getRequestUserId } from "@/lib/auth/requestUser";
import {
  restoreTransaction,
  TransactionRestoreConflict,
} from "@/lib/api/dynamo";
import { RestoreTransactionSchema } from "@/lib/utils/transaction-restore";

export async function POST(request: Request) {
  try {
    const userId = await getRequestUserId(request);
    const body = await request.json().catch(() => null);
    const parsed = RestoreTransactionSchema.safeParse(body?.transaction);
    if (!parsed.success)
      return NextResponse.json(
        { ok: false, error: "Invalid transaction" },
        { status: 400 },
      );
    const restored = await restoreTransaction(userId, parsed.data);
    return NextResponse.json({ ok: true, restored });
  } catch (error) {
    if (error instanceof Response) return error;
    if (error instanceof TransactionRestoreConflict) {
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 409 },
      );
    }
    return NextResponse.json(
      { ok: false, error: "Unable to restore transaction. Please retry." },
      { status: 500 },
    );
  }
}
