// Type surface for the Midnight wallet provider Lace 2.0 injects at
// `window.midnight.mnLace`. We only declare the fields ProofVault uses today;
// extend as more methods are wired.

export type LaceState = {
  address: string;
  addressLegacy?: string;
  coinPublicKey: string;
  encryptionPublicKey?: string;
};

export type LaceApi = {
  state: () => Promise<LaceState>;
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
