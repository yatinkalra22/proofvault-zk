"use client";

import { useCallback, useEffect, useState } from "react";
import type { LaceApi } from "@/lib/lace";

export type LaceStatus =
  | "checking"
  | "unavailable"
  | "disconnected"
  | "connecting"
  | "connected"
  | "error";

export type UseLaceWallet = {
  status: LaceStatus;
  address: string | null;
  error: string | null;
  api: LaceApi | null;
  connect: () => Promise<void>;
};

export function useLaceWallet(): UseLaceWallet {
  const [status, setStatus] = useState<LaceStatus>("checking");
  const [address, setAddress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [api, setApi] = useState<LaceApi | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    // Give the extension a tick to inject the provider after page load.
    const t = setTimeout(() => {
      setStatus(window.midnight?.mnLace ? "disconnected" : "unavailable");
    }, 300);
    return () => clearTimeout(t);
  }, []);

  const connect = useCallback(async () => {
    if (typeof window === "undefined") return;
    const provider = window.midnight?.mnLace;
    if (!provider) {
      setStatus("unavailable");
      return;
    }
    setStatus("connecting");
    setError(null);
    try {
      const nextApi = await provider.enable();
      const state = await nextApi.state();
      setApi(nextApi);
      setAddress(state.address);
      setStatus("connected");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setStatus("error");
    }
  }, []);

  return { status, address, error, api, connect };
}
