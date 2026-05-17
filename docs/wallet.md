# Wallet integration

The prover-app talks to any Midnight-compatible wallet that implements the [DApp Connector API v4](https://www.npmjs.com/package/@midnight-ntwrk/dapp-connector-api). We tested with Lace 2.0 and 1AM. The hook code lives in `apps/prover-app/src/hooks/useMidnightWallet.ts`.

## What "compatible" means

A wallet is compatible if it injects an `InitialAPI` object somewhere under `window.midnight`. The object needs a `connect(networkId)` method that returns a `ConnectedAPI`. The connected API needs `getShieldedAddresses()`, `submitTransaction()`, `balanceUnsealedTransaction()`, `signData()`. Full surface in the [official type definitions](https://www.npmjs.com/package/@midnight-ntwrk/dapp-connector-api).

The spec allows wallets to register under any key (typically a UUID derived from their rdns). Most also expose a friendly alias. Lace uses `mnLace`. 1AM uses `1am` and a UUID.

## How the hook works

```
1. On mount, poll window.midnight every 100ms for up to 3 seconds.
   First match wins. Prefer mnLace if present, otherwise take the
   first key with a connect() method. Set status to "disconnected".

2. On user click, call provider.connect(networkId). The wallet pops
   a UI for the user to approve. Resolves with a ConnectedAPI.

3. Call api.getShieldedAddresses(). If the wallet is still syncing,
   it throws something like "Wallet is syncing, shielded address not
   yet available". Retry every 2 seconds for up to 30 seconds total.
   Surface any non-syncing error immediately.

4. On success, store the shielded address and the api object.
   Status becomes "connected".
```

There is a small diagnostic object exposed on the hook return value. It records `hasMidnight`, the list of keys present, and which key got picked up. The page renders this when status is `unavailable`, so developers can see what is on `window.midnight` without opening DevTools.

## Network ids

`connect(networkId)` takes a string. Wallets echo accepted values back in error messages on mismatch. Known values:

- `undeployed` for the local midnight-local-dev stack
- `preprod` for Preprod testnet
- `mainnet` for MainNet (when it ships)

The dApp reads this from `NEXT_PUBLIC_MIDNIGHT_NETWORK_ID`. Default is `undeployed`. The submitted `.env.example` ships `preprod` because most demos run there.

## The env file gotcha

Next.js reads `.env*` from the Next.js project directory, not from a Turborepo root. Our `.env.local` lives at the monorepo root, so the prover-app needs a symlink:

```bash
cd apps/prover-app
ln -s ../../.env.local .env.local
```

The symlink is gitignored by the same `.env.local` pattern that hides the source. If you skip this step, `NEXT_PUBLIC_MIDNIGHT_NETWORK_ID` falls back to its in-code default of `undeployed`, and the wallet rejects the connection with a network mismatch error.

## Common failure modes and what fixes them

**Button stuck on "Install a Midnight wallet" but the extension is installed.** The wallet is on the wrong Chrome profile, in incognito, or its content script never injected. Open `chrome://extensions`, check site access. Worst case, disable competing Midnight wallet extensions and try again.

**"Network mismatch. Wallet is on X, requested Y."** Wallet's selected network and `NEXT_PUBLIC_MIDNIGHT_NETWORK_ID` disagree. Either switch the wallet, or update the env var and restart `next dev` (env values are baked at process start, hot reload does not pick them up).

**"Wallet is syncing, shielded address not yet available."** Wait. The hook retries this automatically for 30 seconds. If it gives up, open the wallet UI directly and confirm it is on a real network and synced.

**Clicking connect opens a different wallet than expected.** Multiple Midnight wallets are installed, and the one our hook picked is not the one with funds. Disable the others in `chrome://extensions`, or finish setup on whichever one is being grabbed.

**No diagnostic box visible on the page.** You are looking at an older build. Hard reload the tab, and make sure `next dev` restarted after the most recent dependency or env change.

## DApp Connector v3 to v4

Older Midnight tutorials show `provider.enable()` and `api.state()`. That is v1 and v2 of the connector spec. v4 renamed everything. The new shape is `provider.connect(networkId)` and `api.getShieldedAddresses()`. v4 also formalises which functions live on `ConnectedAPI` (the wallet-facing methods) versus `HintUsage` (permission hints). Our hook uses the v4 names.

If you find a wallet that still ships v1, our generic detection will probably skip it because the shape check looks for a `.connect()` method. That is intentional. v1 is not safe to assume given the rest of the stack runs on midnight-js 4.x.

## Code pointers

- Hook: `apps/prover-app/src/hooks/useMidnightWallet.ts`
- Type re-exports: `apps/prover-app/src/lib/wallet.ts`
- UI integration: `apps/prover-app/src/app/page.tsx` (look for `WalletButton`)
- Diagnostic in the simulated executor: `apps/prover-app/src/lib/proverSim.ts`

## See also

- [architecture.md](./architecture.md) for where the wallet sits in the bigger picture.
- [SETUP.md § 2](../SETUP.md) for the installation walkthrough.
- [Midnight DApp Connector spec](https://github.com/midnightntwrk/midnight-dapp-connector-api/blob/main/docs/api/_media/SPECIFICATION.md) for the source of truth on the API.
