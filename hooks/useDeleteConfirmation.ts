/**
 * Note 1: useDeleteConfirmation encapsulates the "request → confirm → execute"
 * pattern that repeats across every list component in the app. Centralising it
 * here eliminates ~20 lines of boilerplate per consumer and guarantees
 * consistent cleanup (isDeleting reset, candidate cleared) even when the
 * onConfirm callback throws.
 */
import { useCallback, useRef, useState } from "react";

export interface UseDeleteConfirmationOptions<T> {
  onConfirm: (item: T) => Promise<void>;
}

export function useDeleteConfirmation<T>({
  onConfirm,
}: UseDeleteConfirmationOptions<T>) {
  const [candidate, setCandidate] = useState<T | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Note 2: A ref keeps the latest onConfirm without forcing confirmDelete to
  // be recreated every time the consumer passes a new inline arrow function.
  const onConfirmRef = useRef(onConfirm);
  onConfirmRef.current = onConfirm;

  const requestDelete = useCallback((item: T) => {
    setCandidate(item);
  }, []);

  const cancelDelete = useCallback(() => {
    setCandidate(null);
  }, []);

  const confirmDelete = useCallback(async () => {
    if (!candidate) return;
    setIsDeleting(true);
    try {
      await onConfirmRef.current(candidate);
    } finally {
      setIsDeleting(false);
      setCandidate(null);
    }
  }, [candidate]);

  return { candidate, requestDelete, confirmDelete, cancelDelete, isDeleting };
}
