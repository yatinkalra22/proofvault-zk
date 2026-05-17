# ProofVault

> Privacy-preserving proof-of-funds credentials on Midnight Network.

Built for the **MLH Midnight Hackathon, May 2026**. DeFi Track.

Students prove they have enough money for visas and university admissions **without revealing their bank balance, account number, or transaction history**. A Compact smart contract on Midnight verifies a signed bank-balance attestation inside a zero-knowledge proof and publishes only `{tierIdx, universityId, expiry, attestorCommit, studentCommit}` on-chain. Universities open a URL and see a verified checkmark.

## Architecture

```
┌──────────────────┐    ┌────────────────────┐    ┌─────────────────┐
│  Prover dApp     │    │  Attestor Backend  │    │ Verifier Portal │
│  (Next.js 14)    │───▶│  (NestJS + Plaid)  │    │  (Next.js 14)   │
│  Midnight wallet │    │  Ed25519 signer    │    │  Indexer query  │
└────────┬─────────┘    └────────────────────┘    └────────┬────────┘
         │                                                  │
         ▼                                                  ▼
   ┌──────────────────────── Midnight Network ─────────────────────┐
   │  Compact contract: verifyAndRecord + redeem + tier ladder     │
   │  Ledger: attestorCommitRoot, nullifiers, proofs               │
   └────────────────────────────────────────────────────────────────┘
```

Longer write-up in [docs/architecture.md](./docs/architecture.md).

## Monorepo Layout

```
apps/
  prover-app/         Next.js 14, student-facing dApp (wallet + Plaid Link)
  verifier-portal/    Next.js 14, public verification page + redeem
  attestor-backend/   NestJS, Plaid exchange + Ed25519 attestation signing
packages/
  contract/           Compact smart contract source + compiled artifacts
  shared-types/       AttestationPayload, ProofRecord, tier constants
  ui/                 Shared shadcn/ui components
```

## Quick Start

> **Requires:** Node.js 22+, Docker Desktop, Compact compiler 0.30.0 (pinned, see SETUP § 1), a Midnight-compatible Chrome wallet (Lace 2.0 or 1AM).

```bash
cp .env.example .env.local            # fill in wallet + Plaid creds
ln -s ../../.env.local apps/prover-app/.env.local   # see docs/wallet.md
npm install
npm run dev                           # boots all apps in parallel via Turborepo
```

For full toolchain installation, Midnight local-dev setup, and `example-counter` deploy verification, see **[SETUP.md](./SETUP.md)**.

## Documentation

| Doc | What it covers |
|---|---|
| [SETUP.md](./SETUP.md) | The full setup walkthrough. Toolchain, wallet, faucet, local Docker stack, demo flow. |
| [docs/architecture.md](./docs/architecture.md) | How the three apps and the contract fit together. Data flow. Stack choices. |
| [docs/wallet.md](./docs/wallet.md) | How the dApp talks to the wallet. DApp Connector v4. Common failures and fixes. |
| [docs/privacy.md](./docs/privacy.md) | What each party sees and does not see. Threat model. Trust assumptions. |

## License

MIT, see [LICENSE](./LICENSE).
