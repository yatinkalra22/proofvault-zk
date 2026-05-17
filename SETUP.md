# ProofVault — Developer Setup

End-to-end setup runbook for the Midnight Hackathon entry. Follow top to bottom; each section ends with a verification command that must exit clean before moving on.

## Prerequisites

| Tool | Version | Why |
|---|---|---|
| Node.js | ≥ 22.0.0 | Required by `midnight-local-dev` and Next.js 14 |
| npm | ≥ 10 | Workspace support |
| Docker Desktop | latest | Runs the Midnight node + indexer + proof server |
| Chrome | latest | Only browser supported by current Midnight wallets |
| Git | any modern | — |

Check with:
```bash
node -v && npm -v && docker --version && git --version
```

---

## 1. Install the Compact toolchain

The `compact` binary is a version manager; the actual compiler is pinned via `compact update <version>`.

```bash
curl --proto '=https' --tlsv1.2 -LsSf \
  https://github.com/midnightntwrk/compact/releases/latest/download/compact-installer.sh | sh
source ~/.zshrc
compact update 0.30.0
```

> **Why pin to 0.30.0 (not latest 0.31.0)?** The current Midnight SDK chain
> (`@midnight-ntwrk/midnight-js@4.0.4` → `compact-js@2.5.0`) hard-pins
> `@midnight-ntwrk/compact-runtime: "0.15.0"`. Compiler 0.31.0 emits bindings
> that require runtime **0.16.0** → mismatch → contract refuses to load.
> Compiler 0.30.0 emits 0.15.0-compatible bindings. When midnight-js@4.1+
> ships with runtime 0.16.0, we can bump.

**Verify** (manager `0.5.x`, compiler `0.30.0`):
```bash
compact --version          # 0.5.x — the CLI manager
compact compile --version  # 0.30.0 — the compiler (matches SDK runtime 0.15.0)
```

**Smoke test** — compile the canary contract:
```bash
compact compile scratch/hello.compact scratch/managed/hello
ls scratch/managed/hello/{zkir,keys,contract}
```

Outputs `zkir/ping.{zkir,bzkir}`, `keys/ping.{prover,verifier}`, and TypeScript bindings in `contract/`.

Docs: [Install the toolchain](https://docs.midnight.network/getting-started/installation) · [Compact compiler release notes](https://docs.midnight.network/relnotes/compact)

---

## 2. Install a Midnight-compatible wallet

The prover-app talks to any wallet that implements the [Midnight DApp Connector API v4](https://www.npmjs.com/package/@midnight-ntwrk/dapp-connector-api) and injects under `window.midnight`. Two known options:

- **Lace 2.0** — unified Cardano + Midnight wallet, injects under `window.midnight.mnLace`.
  Install: https://chromewebstore.google.com/detail/lace/gafhhkghbfjjkeiendhlofajokpaflmk
- **1AM Wallet** — Midnight-focused wallet, injects under `window.midnight.1am` (plus a UUID alias per the spec's rdns convention).

Pick one:

1. Install the extension from the link above.
2. **Create new wallet** → save the 24-word recovery phrase (hackathon throwaway, but still don't share).
3. Switch network → **Midnight Preprod**.
4. Copy the three address types into `.env.local`:
   - **Shielded** (`mn_shield-addr_preprod1...`) — used by the prover-app for ZK contract calls.
   - **Unshielded** (`mn_addr_preprod1...`) — used to receive tNIGHT from the faucet.
   - **Dust** (`mn_dust_preprod1...`) — used for DUST sub-balance management.

Docs: [Midnight wallet guide](https://docs.midnight.network/develop/how-to/lace-wallet) · [DApp Connector API spec](https://github.com/midnightntwrk/midnight-dapp-connector-api)

---

## 3. Get Preprod tNIGHT from the faucet

The Preprod faucet dispenses **tNIGHT**, not tDUST directly — wallets generate DUST from NIGHT internally.

1. Open https://faucet.preprod.midnight.network/
2. Paste your **unshielded** address (`mn_addr_preprod1...`).
3. Click **Request tokens**. Faucet can take hours.

If you see `InvalidAddressError` or `Request Failed`, try the alternate faucet at https://midnight.network/test-faucet, clear browser cache, or retry in 30 min. See [forum thread](https://forum.midnight.network/t/faucet-request-failing-invalidaddresserror/858) for known issues.

---

## 4. Plaid sandbox account

Required by `apps/attestor-backend`. Free dev account, no credit card.

1. Sign up: https://dashboard.plaid.com/signup
2. After verification: **Team Settings → Keys** → grab `client_id` and the **Sandbox** secret.
3. Drop them into `.env.local`:
   ```
   PLAID_CLIENT_ID=<your_client_id>
   PLAID_SECRET=<your_sandbox_secret>
   ```

---

## 5. Boot the Midnight local dev network

We run a self-hosted Midnight node + indexer + proof server in Docker. This is what the contract step (Step 4 of `PLAN.md`) deploys against.

Clone to a **sibling directory** (not inside this repo):

```bash
cd ~/Projects   # or wherever you keep tools
git clone https://github.com/midnightntwrk/midnight-local-dev.git
cd midnight-local-dev
npm install
npm start
```

`npm start` boots the stack, initializes the genesis wallet (500T NIGHT + 1.25T registered for DUST), and presents a funding menu. **Leave this terminal open** — the funding menu is needed later when other contracts (e.g. example-counter) create wallets that need NIGHT.

Pick **option 3 (Display wallets)** to verify state. Don't pick option 4 (Exit) until you're done deploying everything for the day.

**Verify** the three services are healthy from a new terminal:
```bash
docker ps   # all 4 containers should show (healthy) / Up

# Node — GET works
curl -s http://localhost:9944/health
# → {"peers":0,"isSyncing":false,"shouldHavePeers":false}

# Indexer — GraphQL needs POST (GET returns empty body, that's NOT a failure)
curl -s -X POST http://localhost:8088/api/v3/graphql \
  -H 'Content-Type: application/json' \
  -d '{"query":"{ __schema { queryType { name } } }"}'
# → {"data":{"__schema":{"queryType":{"name":"Query"}}}}

# Proof server
curl -s http://localhost:6300/version
# → 8.0.3
```

| Service | Port | URL | Image |
|---|---|---|---|
| Midnight node | 9944 | `http://localhost:9944` | `midnightntwrk/midnight-node:0.22.3` |
| Indexer (GraphQL) | 8088 | `http://localhost:8088/api/v3/graphql` | `midnightntwrk/indexer-standalone:4.0.1` |
| Proof server | 6300 | `http://localhost:6300` | `midnightntwrk/proof-server:8.0.3` |

A fourth container `testcontainers/ryuk:0.14.0` also runs — it's a cleanup helper from midnight-local-dev's test harness. Leave it alone.

**Funding menu options** (in the `npm start` terminal):

| Option | When to use |
|---|---|
| 1. Fund from config file | If you have a JSON of wallet addresses. Skip for hackathon flow. |
| 2. Fund by paying key (NIGHT transfer) | Use when example-counter / our prover-app prints a wallet address that needs NIGHT to deploy or invoke. |
| 3. Display wallets | Diagnostic — shows current balances. |
| 4. Exit | Only when fully done — exits the funding helper. Docker containers keep running. |

**Tear down** (end of day):
```bash
cd ~/Projects/midnight-local-dev
docker compose -f standalone.yml down
```

Docs: [midnightntwrk/midnight-local-dev](https://github.com/midnightntwrk/midnight-local-dev)

---

## 6. Deploy `example-counter` (toolchain end-to-end validation)

This validates the entire build → deploy → invoke path before we write our own contract. If this fails, escalate immediately.

> **Note:** `npm run standalone` is **self-contained** — it spawns its own
> midnight-node + indexer + proof-server via [testcontainers](https://testcontainers.com/)
> on random ports, and funds its own wallet from a baked-in seed. It does
> **not** use the midnight-local-dev stack from §5 or that funding menu.
> You can leave §5 running in parallel (they don't conflict) or shut it
> down to save RAM.

In a **new terminal**:

```bash
cd ~/Projects
git clone https://github.com/midnightntwrk/example-counter.git
cd example-counter
npm install
```

**Compile + unit test the contract:**
```bash
cd contract && npm run compact && npm run build && npm run test && cd ..
```

All 3 tests must pass. If you see `Version mismatch: compiled code expects 0.16.0, runtime is 0.15.0`, your Compact compiler is on 0.31.0 — fix per §1 with `compact update 0.30.0` and recompile.

**Deploy + invoke against the self-contained stack:**
```bash
cd counter-cli && npm run standalone
```

The CLI brings up its own three containers (`counter-node`, `counter-indexer`, `counter-proof-server`), creates a wallet seeded with NIGHT, deploys the counter contract, then drops you into an interactive menu. Pick `increment` — the counter should go `0 → 1`.

**Gate is green when:** the counter value reads `1` after invoke. Capture the contract address and transaction hash from the output for later reference.

**Tear down example-counter's stack** when done validating:
```bash
docker rm -f counter-node counter-indexer counter-proof-server
```

Docs: [example-counter](https://github.com/midnightntwrk/example-counter) · [Counter CLI tutorial](https://docs.midnight.network/tutorials/counter/counter-cli)

---

## 7. Install this repo

```bash
cd ~/Projects/proofvault-zk
cp .env.example .env.local   # then fill in real values (see § 7.5)
npm install
```

The monorepo is a Turborepo workspace. Three apps + two shared packages:

| Path | What it is | Port | Stack |
|---|---|---|---|
| `apps/prover-app` | Student-facing dApp | 3000 | Next.js 14 (app router) + React 18 + Tailwind |
| `apps/attestor-backend` | Signs Ed25519 balance attestations | 4000 | NestJS 11 + Fastify |
| `apps/verifier-portal` | Public proof viewer | tbd | Next.js (scaffold pending) |
| `packages/contract` | Compact contract + TS bindings | — | Compact 0.30.0 + vitest |
| `packages/shared-types` | Cross-app type defs | — | — |

Run all apps at once:
```bash
npm run dev   # Turborepo runs dev across every workspace that defines it
```

Or run one at a time — see § 7.1–7.4.

### 7.1 prover-app (port 3000)

The student-facing dApp. Requires a Midnight-compatible wallet (§ 2) and the attestor-backend (§ 7.2) running on port 4000.

```bash
npm run dev --workspace apps/prover-app
# → ▲ Next.js 14.2 · http://localhost:3000
```

Open http://localhost:3000 in Chrome. The demo flow on the landing page is four numbered steps:

1. **Pick a tier** — three buttons ($30K / $50K / $80K). Selection is local UI state; the choice is enforced inside the ZK circuit later.
2. **Bind to a university** — three-option dropdown (Northeastern, UT Austin, Stanford). The proof becomes redeemable only by the chosen recipient.
3. **Connect wallet** — calls `connect(networkId)` on whatever Midnight DApp Connector v4 provider is injected under `window.midnight.*` (Lace 2.0, 1AM, etc.). On approval, the row collapses into a green pill showing the truncated `mn_shield-addr_...` returned by `getShieldedAddresses()`. If no provider is injected within 3s of page load, the button becomes an amber link to the Midnight wallet docs. The networkId string is read from `NEXT_PUBLIC_MIDNIGHT_NETWORK_ID` (defaults to `"undeployed"`; use `"preprod"` against Preprod).
4. **Attest your bank balance** — POSTs a stub `publicToken` to the attestor's `/verify/plaid`. The attestor returns a signed 5-element preimage; the dApp renders a card with the decoded balance ($75K from the stub), the tier hint, hashes, and the Ed25519 signature.

After all four steps, **Generate proof** runs a state-machine flow (building → proving → submitting → confirmed) and shows a result card with a shareable `/verify/{proofId}` URL, the on-chain fields the verifier portal will look up, and an explorer link.

> **ZK artifacts** are staged from `packages/contract/src/managed/proofvault/` into the dApp's `public/zk/` directory via the `stage-zk` script, which runs automatically before `dev` and `build`. To regenerate after editing the contract:
> ```bash
> npm run compact   --workspace packages/contract
> npm run stage-zk  --workspace apps/prover-app
> ```

Useful scripts:
```bash
npm run build      --workspace apps/prover-app   # next build (re-stages ZK first)
npm run lint       --workspace apps/prover-app   # next lint
npm run type-check --workspace apps/prover-app   # tsc --noEmit
npm run stage-zk   --workspace apps/prover-app   # copy ZK artifacts into public/
```

### 7.2 attestor-backend (port 4000)

NestJS service that issues signed balance attestations. Plaid is the upstream — in dev it runs against a stub if `PLAID_CLIENT_ID` / `PLAID_SECRET` are blank.

```bash
npm run dev --workspace apps/attestor-backend
# → Nest application successfully started · listening on :4000
```

Endpoints:

| Method | Path | Body | Returns |
|---|---|---|---|
| `GET`  | `/attestor/pubkey` | — | `{ attestorPubkey: <32-byte hex> }` |
| `POST` | `/verify/plaid`    | `{ publicToken, walletShieldedAddress }` | `{ preimage[5], signature, attestorPubkey, tierIdxHint }` |

Smoke test:
```bash
curl -s http://localhost:4000/attestor/pubkey
# → {"attestorPubkey":"<64 hex chars>"}

curl -s -X POST http://localhost:4000/verify/plaid \
  -H 'Content-Type: application/json' \
  -d '{"publicToken":"public-sandbox-xxx","walletShieldedAddress":"mn_shield-addr_preprod1abc"}'
# → {"preimage":[...5 hex strings...],"signature":"<128 hex>","attestorPubkey":"...","tierIdxHint":1}
```

> **Dev quirk:** the `dev` script does `tsc && node dist/main.js` (not `tsx`).
> NestJS DI needs `emitDecoratorMetadata`, which `tsx`/esbuild doesn't emit —
> running compiled JS is the path that works.

### 7.3 packages/contract — compile + test

The Compact contract lives at `packages/contract/src/proofvault.compact`. Compile it before invoking the prover-app's contract flow, and re-run after edits.

```bash
# Compile .compact → managed/ (zkir, prover/verifier keys, TS bindings)
npm run compact    --workspace packages/contract

# Run the vitest smoke tests (5 tests)
npm run test       --workspace packages/contract

# Bundle JS + .d.ts into dist/
npm run build      --workspace packages/contract
```

The `managed/` output is regenerated on every compile and is **gitignored** (~13MB of prover keys). CI / fresh clones run `npm run compact` first.

### 7.4 Run everything in parallel

```bash
npm run dev   # turbo spans every dev script in the monorepo
```

Each app prints its banner; logs are interleaved and prefixed by workspace name (the Turborepo TUI lets you scope to one).

### 7.5 `.env.local` — what to fill in

Copy `.env.example` to `.env.local` and set:

| Var | Value for local dev |
|---|---|
| `MIDNIGHT_NETWORK_ID` | `Undeployed` (local-dev) or `TestNet` (Preprod) |
| `MIDNIGHT_NODE_URL` | `http://localhost:9944` |
| `MIDNIGHT_INDEXER_URL` | `http://localhost:8088/api/v3/graphql` |
| `MIDNIGHT_PROOF_SERVER_URL` | `http://localhost:6300` |
| `DEMO_WALLET_*` | Your three wallet addresses (§ 2) |
| `PLAID_CLIENT_ID` / `PLAID_SECRET` | From Plaid Dashboard (§ 4) — blank uses the attestor stub |
| `PLAID_ENV` | `sandbox` |
| `ATTESTOR_PORT` | `4000` |
| `NEXT_PUBLIC_ATTESTOR_URL` | `http://localhost:4000` — where the dApp POSTs `/verify/plaid` |
| `NEXT_PUBLIC_VERIFIER_BASE_URL` | `http://localhost:3001` — origin used to build the result-card `/verify/{proofId}` link |

`.env.local` is gitignored. `.env.example` is committed and tracks the shape.

---

## 8. Testing the app

Three layers of verification, in increasing scope.

### 8.1 Static checks (sub-second)

Run from the repo root:

```bash
npm run type-check    # tsc --noEmit across every workspace via Turborepo
npm run lint          # next lint + workspace lints
```

### 8.2 Unit tests — contract circuits

```bash
npm run test --workspace packages/contract
# → 5 vitest smoke tests covering ProofVault Compact bindings + witnesses
```

If you see `Version mismatch: compiled code expects 0.16.0, runtime is 0.15.0`, recompile with the pinned compiler — see § 1.

### 8.3 Manual end-to-end demo flow

In two terminals:

```bash
# Terminal A — attestor backend
npm run dev --workspace apps/attestor-backend
# Wait for: [attestor] listening on http://0.0.0.0:4000

# Terminal B — prover-app
npm run dev --workspace apps/prover-app
# Wait for: ▲ Next.js 14.2 · http://localhost:3000
```

Quick health checks before opening the browser:

```bash
curl -s http://localhost:4000/attestor/pubkey | head -c 80
# → {"attestorPubkey":"<64 hex chars>"}

curl -sI http://localhost:3000/zk/proofvault/keys/verifyAndRecord.prover | head -1
# → HTTP/1.1 200 OK   (confirms ZK artifacts are staged for the dApp)
```

Then in Chrome at http://localhost:3000:

| Step | Expected |
|---|---|
| Page loads | Header "Prove your funds. Reveal nothing." renders, footer shows `wallet checking → disconnected` after ~300ms |
| Click a tier button | Selected tier gets the cyan glow border; footer updates `tier 0/1/2` |
| Pick a university | Footer updates `tier N · {university-id}` |
| Click **Connect wallet** | Wallet popup appears; on approve the button collapses to `● Connected   mn_shield-addr_…` |
| Click **Link bank account (sandbox)** | After ~200ms an Attestation card shows: tier hint `$50K`, balance `$75,000.00`, timestamp, truncated hashes |
| Click **Generate proof** | Button label cycles `Building inputs…` → `Generating ZK proof… 0.5s…3.5s` (live timer) → `Submitting to Midnight…` → result card appears |
| Result card | Cyan glow border, shareable `/verify/{proofId}` URL, on-chain fields (tier, university, expiry, attestor/student commits), explorer link |
| Click **Start over** | Returns to the Generate-proof button; selections preserved |

Failure modes worth catching:

| Symptom | Likely cause | Fix |
|---|---|---|
| `No Midnight wallet detected` button shown | No DApp Connector v4 provider on `window.midnight` | Re-check § 2; ensure Midnight is the active network in your wallet |
| `Network mismatch. Wallet is on X, requested Y` | `NEXT_PUBLIC_MIDNIGHT_NETWORK_ID` doesn't match the wallet's selected network — or Next.js isn't reading `.env.local` | Set the var to the wallet's network (`preprod`, etc.). Next.js reads `.env*` from the Next project dir, so symlink the monorepo-root `.env.local` into `apps/prover-app/`: `cd apps/prover-app && ln -s ../../.env.local .env.local` |
| Attestation step shows `attestor /verify/plaid failed: TypeError: Failed to fetch` | attestor-backend not running | Start terminal A; confirm port 4000 is free |
| Generate proof errors immediately | Wallet disconnected mid-flow or attestation expired | Click **Re-link** on the attestation card and **Connect wallet** again |
| ZK artifact 404 in devtools network tab | `stage-zk` didn't run | `npm run stage-zk --workspace apps/prover-app` then refresh |

---

## Daily Workflow

Once setup is complete, a normal dev day looks like:

```bash
# Terminal 1 — local-dev network (leave running all day)
cd ~/Projects/midnight-local-dev
npm start
# Leave on funding menu; use option 2 when other CLIs print an address that needs NIGHT.

# Terminal 2 — recompile contract if you edited .compact
cd ~/Projects/proofvault-zk
npm run compact --workspace packages/contract

# Terminal 3 — apps
npm run dev
# prover-app  → http://localhost:3000
# attestor    → http://localhost:4000
```

**End of day** — tear down the local-dev stack to free RAM:
```bash
cd ~/Projects/midnight-local-dev
docker compose -f standalone.yml down
```

## Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| `CompactError: Version mismatch: compiled code expects 0.16.0, runtime is 0.15.0` | Compact compiler is on 0.31.0 but SDK chain pins runtime 0.15.0 | `compact update 0.30.0` then recompile |
| `Request Failed` / `InvalidAddressError` on Preprod faucet | Wrong address type or faucet rate limit | Use unshielded `mn_addr_*`, not shielded; retry after 30 min or use `midnight.network/test-faucet` |
| `npm run standalone` says `Missing script` | Ran in `contract/` instead of `counter-cli/` | `cd counter-cli` first |
| `curl http://localhost:8088/api/v3/graphql` returns empty body | GraphQL needs POST | Use the POST query in §5 — empty GET response is not a failure |
| `counter-proof-server` shows `(unhealthy)` in `docker ps` | Image missing `curl`, healthcheck command broken | Cosmetic only — `curl` the port directly to confirm it serves 200; safe to ignore |
| Counter / midnight `node` / `indexer` containers unhealthy | Real port conflict with another local stack | `lsof -i :9944 -i :8088 -i :6300`; stop the conflicting process |
| Wallet shows only Cardano (no Midnight) | Wallet's Midnight feature not enabled | Switch network inside the wallet to Midnight Preprod (§2) |
