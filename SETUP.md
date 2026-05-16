# ProofVault — Developer Setup

End-to-end setup runbook for the Midnight Hackathon entry. Follow top to bottom; each section ends with a verification command that must exit clean before moving on.

## Prerequisites

| Tool | Version | Why |
|---|---|---|
| Node.js | ≥ 22.0.0 | Required by `midnight-local-dev` and Next.js 14 |
| npm | ≥ 10 | Workspace support |
| Docker Desktop | latest | Runs the Midnight node + indexer + proof server |
| Chrome | latest | Only browser supported by Lace |
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

## 2. Install Lace 2.0 (unified Midnight + Cardano wallet)

The standalone "Lace Midnight Preview" extension is deprecated. Use **Lace 2.0**, which has Midnight built in.

1. Install: https://chromewebstore.google.com/detail/lace/gafhhkghbfjjkeiendhlofajokpaflmk
2. Open Lace → **Create new wallet** → save the 24-word recovery phrase (hackathon throwaway, but still don't share).
3. Switch network → select **Midnight Preprod / Testnet**.
4. Copy the three address types into `.env.local`:
   - **Shielded** (`mn_shield-addr_preprod1...`) — used by the prover-app for ZK contract calls.
   - **Unshielded** (`mn_addr_preprod1...`) — used to receive tNIGHT from the faucet.
   - **Dust** (`mn_dust_preprod1...`) — used for DUST sub-balance management in Lace.

Docs: [Lace wallet guide](https://docs.midnight.network/develop/how-to/lace-wallet) · [Lace 2.0 unified release](https://www.lace.io/blog/one-wallet-for-all-midnight-is-now-inside-lace)

---

## 3. Get Preprod tNIGHT from the faucet

The Preprod faucet dispenses **tNIGHT**, not tDUST directly — Lace generates DUST from NIGHT inside the wallet.

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
cp .env.example .env.local   # then fill in real values
npm install
```

Run a single app:
```bash
npm run dev --workspace apps/prover-app
```

Or all apps in parallel via Turborepo:
```bash
npm run dev
```

---

## Daily Workflow

Once setup is complete, a normal dev day looks like:

```bash
# Terminal 1 — local-dev network (leave running all day)
cd ~/Projects/midnight-local-dev
npm start
# Leave on funding menu; use option 2 when other CLIs print an address that needs NIGHT.

# Terminal 2 — work
cd ~/Projects/proofvault-zk
npm run dev                          # all apps in parallel via Turborepo
# or: npm run dev --workspace apps/prover-app

# Recompile contract after editing packages/contract/src/*.compact
compact compile packages/contract/src/proofvault.compact packages/contract/src/managed/proofvault
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
| Lace shows only Cardano (no Midnight) | Old Lace Midnight Preview installed | Uninstall it; install Lace 2.0 (§2) |
