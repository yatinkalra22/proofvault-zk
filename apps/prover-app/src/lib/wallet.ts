// Re-export the canonical types from the Midnight DApp Connector API.
// Compatible wallets inject an `InitialAPI` somewhere under `window.midnight`;
// calling `connect(networkId)` returns a `ConnectedAPI` for reading
// addresses, configuration, signing, and balancing transactions.
export type { InitialAPI, ConnectedAPI, Configuration } from "@midnight-ntwrk/dapp-connector-api";
import "@midnight-ntwrk/dapp-connector-api"; // pulls in the `window.midnight` global augmentation

export function truncateAddress(addr: string, head = 14, tail = 6): string {
  if (addr.length <= head + tail + 1) return addr;
  return `${addr.slice(0, head)}…${addr.slice(-tail)}`;
}
