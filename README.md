# ProofVault

> Privacy-preserving proof-of-funds credentials on Midnight Network.

Built for the **MLH Midnight Hackathon, May 2026** — DeFi Track.

Students prove they have enough money for visas and university admissions **without revealing their bank balance, account number, or transaction history**. A Compact smart contract on Midnight verifies a signed bank-balance attestation inside a zero-knowledge proof and publishes only `{tierIdx, universityId, expiry, attestorCommit, studentCommit}` on-chain. Universities open a URL and see a verified checkmark.

## Architecture

```
┌──────────────────┐    ┌────────────────────┐    ┌─────────────────┐
│  Prover dApp     │    │  Attestor Backend  │    │ Verifier Portal │
│  (Next.js 14)    │───▶│  (NestJS + Plaid)  │    │  (Next.js 14)   │
│  Lace wallet     │    │  Ed25519 signer    │    │  Indexer query  │
└────────┬─────────┘    └────────────────────┘    └────────┬────────┘
         │                                                  │
         ▼                                                  ▼
   ┌──────────────────────── Midnight Network ─────────────────────┐
   │  Compact contract: verifyAndRecord + redeem + tier ladder     │
   │  Ledger: attestorCommitRoot, nullifiers, proofs               │
   └────────────────────────────────────────────────────────────────┘
```

## Monorepo Layout

```
apps/
  prover-app/         Next.js 14 — student-facing dApp (Lace + Plaid Link)
  verifier-portal/    Next.js 14 — public verification page + redeem
  attestor-backend/   NestJS — Plaid exchange + Ed25519 attestation signing
packages/
  contract/           Compact smart contract source + compiled artifacts
  shared-types/       AttestationPayload, ProofRecord, tier constants
  ui/                 Shared shadcn/ui components
```

## Quick Start

> **Requires:** Node.js 22+, Docker Desktop, Compact compiler 0.31+, Lace Midnight Preview Chrome extension.

```bash
npm install
npm run dev        # boots all apps in parallel via Turborepo
```

For Midnight local network setup, see [midnightntwrk/midnight-local-dev](https://github.com/midnightntwrk/midnight-local-dev).

## License

MIT — see [LICENSE](./LICENSE).
