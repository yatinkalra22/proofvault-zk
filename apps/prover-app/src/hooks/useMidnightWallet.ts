"use client";

import { useCallback, useEffect, useState } from "react";
import type { InitialAPI, ConnectedAPI } from "@/lib/wallet";

export type WalletStatus =
  | "checking"
  | "unavailable"
  | "disconnected"
  | "connecting"
  | "connected"
  | "error";

export type WalletDiagnostic = {
  hasMidnight: boolean;
  keys: string[];
  usingKey: string | null;
};

export type UseMidnightWallet = {
  status: WalletStatus;
  address: string | null;
  error: string | null;
  api: ConnectedAPI | null;
  diagnostic: WalletDiagnostic | null;
  connect: () => Promise<void>;
};

const NETWORK_ID = process.env.NEXT_PUBLIC_MIDNIGHT_NETWORK_ID ?? "undeployed";

// Wallets may return "syncing" / "not yet available" from getShieldedAddresses()
// for a few seconds after connect() resolves while they catch up to the chain.
// Retry on those, surface anything else immediately.
async function pollShieldedAddress(
  api: ConnectedAPI,
  maxMs: number,
): Promise<string> {
  const start = Date.now();
  let lastError: unknown = null;
  while (Date.now() - start < maxMs) {
    try {
      const { shieldedAddress } = await api.getShieldedAddresses();
      return shieldedAddress;
    } catch (e) {
      lastError = e;
      const msg = e instanceof Error ? e.message.toLowerCase() : "";
      const transient =
        msg.includes("sync") ||
        msg.includes("not yet") ||
        msg.includes("not available");
      if (!transient) throw e;
      await new Promise((r) => setTimeout(r, 2000));
    }
  }
  throw lastError ?? new Error("Wallet did not finish syncing in time.");
}

// Different Midnight wallets register under different keys (friendly aliases
// or UUID rdns per the DApp Connector spec). Accept any provider that exposes
// a connect() method; prefer the documented `mnLace` when present.
function findProvider(): { key: string; api: InitialAPI } | null {
  if (typeof window === "undefined") return null;
  const midnight = window.midnight;
  if (!midnight) return null;
  if (midnight.mnLace) return { key: "mnLace", api: midnight.mnLace };
  for (const key of Object.keys(midnight)) {
    const api = midnight[key];
    if (api && typeof api.connect === "function") return { key, api };
  }
  return null;
}

export function useMidnightWallet(): UseMidnightWallet {
  const [status, setStatus] = useState<WalletStatus>("checking");
  const [address, setAddress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [api, setApi] = useState<ConnectedAPI | null>(null);
  const [diagnostic, setDiagnostic] = useState<WalletDiagnostic | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const start = Date.now();
    let timer: ReturnType<typeof setTimeout> | null = null;
    const check = () => {
      const found = findProvider();
      if (found) {
        const hasMidnight = Boolean(window.midnight);
        const keys = hasMidnight ? Object.keys(window.midnight!) : [];
        setDiagnostic({ hasMidnight, keys, usingKey: found.key });
        setStatus("disconnected");
        return;
      }
      if (Date.now() - start >= 3000) {
        const hasMidnight = Boolean(window.midnight);
        const keys = hasMidnight ? Object.keys(window.midnight!) : [];
        console.warn(
          "[ProofVault] No Midnight DApp Connector found after 3s.",
          "window.midnight is",
          hasMidnight ? `defined with keys: ${keys.join(", ") || "(empty object)"}` : "undefined",
        );
        setDiagnostic({ hasMidnight, keys, usingKey: null });
        setStatus("unavailable");
        return;
      }
      timer = setTimeout(check, 100);
    };
    check();
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, []);

  const connect = useCallback(async () => {
    if (typeof window === "undefined") return;
    const found = findProvider();
    if (!found) {
      const hasMidnight = Boolean(window.midnight);
      const keys = hasMidnight ? Object.keys(window.midnight!) : [];
      setDiagnostic({ hasMidnight, keys, usingKey: null });
      setStatus("unavailable");
      setError(
        !hasMidnight
          ? "No Midnight wallet detected on this page."
          : "A Midnight namespace is present but no provider with a connect() method is registered.",
      );
      return;
    }
    setStatus("connecting");
    setError(null);
    try {
      const connected = await found.api.connect(NETWORK_ID);
      setApi(connected);
      const shieldedAddress = await pollShieldedAddress(connected, 30_000);
      setAddress(shieldedAddress);
      setStatus("connected");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setStatus("error");
    }
  }, []);

  return { status, address, error, api, diagnostic, connect };
}
