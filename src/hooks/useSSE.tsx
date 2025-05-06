// src/hooks/useSSE.ts
import { useEffect, useState } from "react";

interface SSEOptions<T> {
  path: string | null;
  disabled?: boolean;
}

interface SSEState<T> {
  data: T | null;
  error: Error | null;
  status: "idle" | "connecting" | "active" | "error";
}

export function useSSE<T>(
  eventName: string,
  options: SSEOptions<T>
): SSEState<T> {
  const [state, setState] = useState<SSEState<T>>({
    data: null,
    error: null,
    status: "idle",
  });

  useEffect(() => {
    if (options.disabled || !options.path) {
      setState((prev) => ({ ...prev, status: "idle" }));
      return;
    }

    setState((prev) => ({ ...prev, status: "connecting" }));

    const eventSource = new EventSource(options.path);

    eventSource.onopen = () => {
      setState((prev) => ({ ...prev, status: "active" }));
    };

    const handleMessage = (event: MessageEvent) => {
      try {
        const parsedData = JSON.parse(event.data) as T;
        setState({
          data: parsedData,
          error: null,
          status: "active",
        });
      } catch (err) {
        setState({
          data: null,
          error: err instanceof Error ? err : new Error("SSE data parse error"),
          status: "error",
        });
      }
    };

    eventSource.addEventListener(eventName, handleMessage);

    eventSource.onerror = () => {
      setState({
        data: null,
        error: new Error("SSE connection error"),
        status: "error",
      });
      eventSource.close();
    };

    return () => {
      eventSource.removeEventListener(eventName, handleMessage);
      eventSource.close();
      setState((prev) => ({ ...prev, status: "idle" }));
    };
  }, [eventName, options.path, options.disabled]);

  return state;
}
