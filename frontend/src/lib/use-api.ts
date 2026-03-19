"use client";

import { useCallback, useEffect, useState } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001";
const BYPASS_AUTH = process.env.NEXT_PUBLIC_BYPASS_AUTH === "true";

const noopGetToken = async (): Promise<string | null> => null;

function useGetToken(): () => Promise<string | null> {
  if (BYPASS_AUTH) {
    return noopGetToken;
  }
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const clerk = require("@clerk/nextjs");
  return clerk.useAuth().getToken;
}

export function useApi<T>(path: string, options?: { skip?: boolean }) {
  const getToken = useGetToken();
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(!options?.skip);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const token = BYPASS_AUTH ? null : await getToken();
      const res = await fetch(`${API_BASE}${path}`, {
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
      const json = await res.json();
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [getToken, path]);

  useEffect(() => {
    if (!options?.skip) {
      fetchData();
    }
  }, [fetchData, options?.skip]);

  return { data, loading, error, refetch: fetchData };
}

export function useApiPost<TBody, TResponse>() {
  const getToken = useGetToken();
  const [loading, setLoading] = useState(false);

  const post = useCallback(
    async (path: string, body: TBody): Promise<TResponse> => {
      setLoading(true);
      try {
        const token = BYPASS_AUTH ? null : await getToken();
        const res = await fetch(`${API_BASE}${path}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify(body),
        });
        if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
        return await res.json();
      } finally {
        setLoading(false);
      }
    },
    [getToken]
  );

  return { post, loading };
}

export function useApiPut<TBody, TResponse>() {
  const getToken = useGetToken();
  const [loading, setLoading] = useState(false);

  const put = useCallback(
    async (path: string, body: TBody): Promise<TResponse> => {
      setLoading(true);
      try {
        const token = BYPASS_AUTH ? null : await getToken();
        const res = await fetch(`${API_BASE}${path}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify(body),
        });
        if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
        return await res.json();
      } finally {
        setLoading(false);
      }
    },
    [getToken]
  );

  return { put, loading };
}

export function useAuthenticatedDownload() {
  const getToken = useGetToken();

  const download = useCallback(
    async (path: string, filename: string, options?: { method?: string; body?: unknown }) => {
      const token = BYPASS_AUTH ? null : await getToken();
      const res = await fetch(`${API_BASE}${path}`, {
        method: options?.method || "GET",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        ...(options?.body ? { body: JSON.stringify(options.body) } : {}),
      });
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    },
    [getToken]
  );

  return { download };
}
