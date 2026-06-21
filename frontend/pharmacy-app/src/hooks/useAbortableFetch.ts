import { useCallback, useRef, useState } from "react";

type FetchFn<T> = (signal: AbortSignal, ...args: any[]) => Promise<T>;
type FetchResult<T> = {
  success: boolean;
  data: T | null;
  error: any;
};

type AbortControllerRef = { current: AbortController | null };

interface UseAbortableFetchOptions {
  // Optional shared abort controller ref for use across multiple component instances
  sharedAbortControllerRef?: AbortControllerRef;
}

export function useAbortableFetch<T = any>(
  fetchFn: FetchFn<T>,
  options?: UseAbortableFetchOptions,
) {
  const internalAbortControllerRef = useRef<AbortController | null>(null);

  // Use shared ref if provided, otherwise use internal ref
  const abortControllerRef =
    options?.sharedAbortControllerRef ?? internalAbortControllerRef;

  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const abort = useCallback(() => {
    abortControllerRef.current?.abort();
  }, [abortControllerRef]);

  const runFetch = useCallback(
    async (...args: any[]): Promise<FetchResult<T>> => {
      abortControllerRef.current?.abort();

      const controller = new AbortController();
      abortControllerRef.current = controller;

      setLoading(true);
      setError(null);

      try {
        const result = await fetchFn(controller.signal, ...args);
        setData(result);

        return {
          success: true,
          data: result,
          error: null,
        };
      } catch (err: any) {
        if (err.name !== "AbortError") {
          setError(err);
        }

        return {
          success: false,
          data: null,
          error: err,
        };
      } finally {
        setLoading(false);
      }
    },
    [fetchFn, abortControllerRef],
  );

  return { runFetch, abort, data, error, loading };
}

// Create a shared abort controller ref for use across multiple components
export const createSharedAbortControllerRef = (): AbortControllerRef => ({
  current: null,
});
