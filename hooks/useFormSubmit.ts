/**
 * Note 1: useFormSubmit standardizes the POST/PUT upsert pattern shared by
 * several form components (SalaryForm, RetirementForm, MilestoneForm).
 * It manages loading and error state, calls `apiFetch` with a JSON body, and
 * interprets the `{ ok, created, updated, error }` response contract shared by
 * the current progress and salary routes.
 *
 * Why a hook instead of a plain helper?  The loading and error states are React
 * state that must live inside the component tree so the UI re-renders when they
 * change.  Extracting them into a hook keeps every form from duplicating the
 * same useState + try/catch/finally boilerplate.
 */
"use client";

import { useState } from "react";
import { apiFetch } from "@/lib/api/apiFetch";

/** Configuration accepted by {@link useFormSubmit}. */
export interface UseFormSubmitOptions<T = unknown> {
  /** API endpoint URL (e.g. `"/api/salary"`). Used for both POST and PUT. */
  baseUrl: string;
  /** Called with the created/updated record on a successful response. */
  onSuccess?: (data: T) => void | Promise<void>;
  /** Optional callback invoked with the error message on failure. */
  onError?: (error: string) => void;
}

export interface UseFormSubmitReturn {
  /** Send form data. Pass `isEditing = true` to use PUT instead of POST. */
  submit: (body: Record<string, unknown>, isEditing?: boolean) => Promise<void>;
  /** Whether a request is currently in flight. */
  isSubmitting: boolean;
  /** The latest error message, or `null` when idle / after a reset. */
  error: string | null;
}

/**
 * Hook that encapsulates the common form-submit lifecycle:
 *
 * 1. Clear previous error → set loading
 * 2. POST (create) or PUT (update) via `apiFetch`
 * 3. Parse `{ ok, created?, updated?, error? }` response
 * 4. On success → call `onSuccess`; on failure → surface error
 * 5. Reset loading
 *
 * Note 2: The hook intentionally does NOT append an id to the URL because all
 * current API routes expect the id inside the JSON body, not as a path segment.
 */
export function useFormSubmit<T = unknown>({
  baseUrl,
  onSuccess,
  onError,
}: UseFormSubmitOptions<T>): UseFormSubmitReturn {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Note 3: `submit` is a plain async function (not wrapped in useCallback)
  // because the calling forms only invoke it from event handlers — it is never
  // passed as a dependency to other hooks, so referential stability is not
  // required.  Keeping it simple avoids a stale-closure footgun with the
  // onSuccess/onError callbacks.
  async function submit(
    body: Record<string, unknown>,
    isEditing = false,
  ): Promise<void> {
    setError(null);
    setIsSubmitting(true);
    try {
      const res = await apiFetch(baseUrl, {
        method: isEditing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "Save failed");
      // Note 4: `await Promise.resolve(...)` ensures that if onSuccess returns
      // a Promise (e.g. the caller refreshes data), loading stays true until
      // that work completes — matching MilestoneForm's original await behavior.
      await Promise.resolve(onSuccess?.(data.created ?? data.updated));
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
      onError?.(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return { submit, isSubmitting, error };
}
