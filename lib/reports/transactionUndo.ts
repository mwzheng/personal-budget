import type { Transaction } from "../types/types";
import { RestoreTransactionSchema } from "../utils/transaction-restore";

export type UndoNotice = {
  key: number;
  transaction: Transaction;
  status: "ready" | "restoring" | "retry" | "conflict";
  message?: string;
};
type Options = {
  request: (input: string, init: RequestInit) => Promise<Response>;
  isCurrent: () => boolean;
  onRemoved: (id: string, deleted: Transaction | null) => void;
  onRestored: (restored: Transaction) => void;
};

type ApiError = { ok?: unknown; error?: unknown };

function readApiError(data: unknown, fallback: string) {
  if (
    data &&
    typeof data === "object" &&
    typeof (data as ApiError).error === "string"
  ) {
    return (data as ApiError).error;
  }
  return fallback;
}

function readDeletedTransaction(data: unknown): Transaction | null | undefined {
  if (!data || typeof data !== "object" || (data as ApiError).ok !== true)
    return undefined;
  const deleted = (data as { deleted?: unknown }).deleted;
  if (deleted === null) return null;
  return RestoreTransactionSchema.safeParse(deleted).data;
}

function readRestoredTransaction(data: unknown): Transaction | undefined {
  if (!data || typeof data !== "object" || (data as ApiError).ok !== true)
    return undefined;
  return RestoreTransactionSchema.safeParse(
    (data as { restored?: unknown }).restored,
  ).data;
}

/** One visible recovery window at a time; snapshots live only in this controller. */
export class TransactionUndoController {
  private queue: UndoNotice[] = [];
  private listeners = new Set<() => void>();
  private timer: ReturnType<typeof setTimeout> | undefined;
  private remaining = 10_000;
  private started = 0;
  private pauses = new Set<string>();
  private disposed = false;
  private nextKey = 0;
  private generation = 0;
  announcement = "";
  constructor(private options: Options) {}
  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };
  getSnapshot = () => this.queue;
  private current = () => !this.disposed && this.options.isCurrent();
  private emit() {
    this.listeners.forEach((listener) => listener());
  }
  private stopTimer() {
    if (this.timer !== undefined) {
      clearTimeout(this.timer);
      this.timer = undefined;
      this.remaining = Math.max(
        0,
        this.remaining - (Date.now() - this.started),
      );
    }
  }
  private startTimer() {
    if (
      this.timer !== undefined ||
      this.pauses.size ||
      this.queue[0]?.status !== "ready"
    )
      return;
    this.started = Date.now();
    this.timer = setTimeout(() => {
      this.timer = undefined;
      this.dismiss();
    }, this.remaining);
  }
  pause(reason: string, paused: boolean) {
    this.stopTimer();
    if (paused) this.pauses.add(reason);
    else this.pauses.delete(reason);
    this.startTimer();
  }
  dismiss = () => {
    if (this.queue[0]?.status === "restoring") return;
    this.stopTimer();
    this.queue = this.queue.slice(1);
    this.remaining = 10_000;
    if (!this.queue.length) {
      this.pauses.delete("hover");
      this.pauses.delete("focus");
    }
    this.emit();
    this.startTimer();
  };
  async remove(transaction: Transaction): Promise<boolean> {
    if (!this.current()) return false;
    const generation = this.generation;
    const response = await this.options.request("/api/transactions", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: transaction.id, date: transaction.date }),
    });
    const data: unknown = await response.json();
    const deleted = readDeletedTransaction(data);
    if (!response.ok || deleted === undefined) {
      throw Object.assign(
        new Error(readApiError(data, "Failed to delete transaction")),
        { status: response.status },
      );
    }
    if (!this.current() || generation !== this.generation) return false;
    this.options.onRemoved(transaction.id, deleted);
    if (deleted) {
      this.queue = [
        ...this.queue,
        { key: ++this.nextKey, transaction: deleted, status: "ready" },
      ];
      this.announcement = "";
      this.emit();
      this.startTimer();
    }
    return true;
  }
  restore = async () => {
    const notice = this.queue[0];
    if (
      !notice ||
      !["ready", "retry"].includes(notice.status) ||
      !this.current()
    )
      return;
    const generation = this.generation;
    this.stopTimer();
    this.queue = [{ ...notice, status: "restoring" }, ...this.queue.slice(1)];
    this.emit();
    try {
      const response = await this.options.request("/api/transactions/restore", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transaction: notice.transaction }),
      });
      const data: unknown = await response.json();
      if (!this.current() || generation !== this.generation) return;
      if (response.status === 409) {
        this.queue = [
          {
            ...notice,
            status: "conflict",
            message:
              "A different transaction already exists. It was not overwritten.",
          },
          ...this.queue.slice(1),
        ];
        this.emit();
        return;
      }
      const restored = readRestoredTransaction(data);
      if (!response.ok || !restored)
        throw new Error("Unable to restore transaction. Please retry.");
      this.options.onRestored(restored);
      this.announcement = "Transaction restored.";
      this.queue = [{ ...notice, status: "ready" }, ...this.queue.slice(1)];
      this.dismiss();
    } catch {
      if (!this.current() || generation !== this.generation) return;
      this.queue = [
        {
          ...notice,
          status: "retry",
          message: "Unable to restore transaction. Please retry.",
        },
        ...this.queue.slice(1),
      ];
      this.emit();
    }
  };
  clear() {
    this.generation++;
    this.stopTimer();
    this.queue = [];
    this.remaining = 10_000;
    this.announcement = "";
    this.pauses.clear();
    this.emit();
  }
  activate() {
    this.disposed = false;
  }
  dispose() {
    this.disposed = true;
    this.clear();
  }
}
