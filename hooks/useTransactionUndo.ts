"use client";
import { useEffect, useMemo, useRef, useSyncExternalStore } from "react";
import { AUTH_CHANGED_EVENT } from "@/lib/auth/cognitoClient";
import { apiFetch } from "@/lib/api/apiFetch";
import { currentTransactionScope } from "@/lib/auth/accountScope";
import { TransactionUndoController } from "@/lib/reports/transactionUndo";
import type { Transaction } from "@/lib/types/types";

export function useTransactionUndo(options: {
  scope: string | null;
  onRemoved: (id: string, deleted: Transaction | null) => void;
  onRestored: (transaction: Transaction) => void;
}) {
  const latest = useRef(options);
  latest.current = options;
  const scope = options.scope;
  const controller = useMemo(
    () =>
      new TransactionUndoController({
        request: apiFetch,
        isCurrent: () =>
          scope !== null &&
          latest.current.scope === scope &&
          currentTransactionScope() === scope,
        onRemoved: (id, deleted) => latest.current.onRemoved(id, deleted),
        onRestored: (transaction) => latest.current.onRestored(transaction),
      }),
    [scope],
  );
  const queue = useSyncExternalStore(
    controller.subscribe,
    controller.getSnapshot,
    controller.getSnapshot,
  );
  useEffect(() => {
    controller.activate();
    const visibility = () => controller.pause("hidden", document.hidden);
    const authChanged = () => {
      controller.clear();
      visibility();
    };
    window.addEventListener(AUTH_CHANGED_EVENT, authChanged);
    visibility();
    document.addEventListener("visibilitychange", visibility);
    return () => {
      window.removeEventListener(AUTH_CHANGED_EVENT, authChanged);
      document.removeEventListener("visibilitychange", visibility);
      controller.dispose();
    };
  }, [controller]);
  return {
    controller,
    notice: queue[0],
    announcement: controller.announcement,
  };
}
