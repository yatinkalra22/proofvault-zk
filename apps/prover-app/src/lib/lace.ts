// Type surface for the Midnight wallet provider Lace 2.0 injects at
// `window.midnight.mnLace`. We model only what the dApp uses today; expand as
// integration deepens.

export type LaceState = {
  address: string;
  addressLegacy?: string;
  coinPublicKey: string;
  encryptionPublicKey?: string;
};

// `serviceUriConfig`, `balanceTx`, and `submitTx` are exposed by Lace for the
// midnight-js provider bridge. They're declared here but not wired yet — the
// current 6D flow uses a simulated executor (see src/lib/proverSim.ts).
export type LaceServiceUriConfig = {
  nodeUri: string;
  indexerUri: string;
  indexerWsUri: string;
  proverServerUri: string;
};

export type LaceApi = {
  state: () => Promise<LaceState>;
  serviceUriConfig?: () => Promise<LaceServiceUriConfig>;
  balanceTx?: (tx: unknown, ttl?: Date) => Promise<unknown>;
  submitTx?: (tx: unknown) => Promise<string>;
};

export type LaceProvider = {
  name: string;
  apiVersion: string;
  isEnabled?: () => Promise<boolean>;
  enable: () => Promise<LaceApi>;
};

declare global {
  interface Window {
    midnight?: {
      mnLace?: LaceProvider;
    };
  }
}

export function truncateAddress(addr: string, head = 14, tail = 6): string {
  if (addr.length <= head + tail + 1) return addr;
  return `${addr.slice(0, head)}…${addr.slice(-tail)}`;
}
