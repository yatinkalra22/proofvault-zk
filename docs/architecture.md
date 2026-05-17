# Architecture

ProofVault is three apps, one Compact contract, and a wallet. Each piece has one job and minimum overlap with the rest. The whole point is keeping data in exactly the places it has to be.

## The pieces

**Prover dApp** (`apps/prover-app`, Next.js 14). The student opens this. It connects to their wallet, calls the attestor, runs the ZK proof in the browser, and submits the resulting transaction.

**Attestor backend** (`apps/attestor-backend`, NestJS on Fastify). Owns one Ed25519 keypair. Exposes two endpoints. `/attestor/pubkey` returns the pubkey. `/verify/plaid` takes a Plaid public token, pulls the balance from Plaid, and returns a five field preimage plus a signature over it.

**Verifier portal** (`apps/verifier-portal`, Next.js 14). The university opens this. It queries the Midnight indexer for a proof record by id and renders the five public fields. No wallet required.

**Compact contract** (`packages/contract`). One circuit, `verifyAndRecord`. Takes the signed attestation as a witness, checks the Ed25519 signature, asserts that the balance clears the tier, derives a student commitment, and writes the public fields to the ledger.

**Shared types** (`packages/shared-types`). The `AttestationPayload`, `ProofRecord`, and tier constants that the three apps and the contract all agree on.

## Data flow

```
1. Student picks tier and university in the dApp.
2. Student connects wallet. dApp calls connect(networkId) on the
   DApp Connector and stores the shielded address.
3. Student clicks "link bank". dApp opens Plaid Link, gets a
   public_token, POSTs it to attestor /verify/plaid.
4. Attestor exchanges the public_token with Plaid, pulls the
   balance, builds a 5-field preimage [balanceCents, accountHash,
   institutionHash, timestamp, nonce], signs it with Ed25519,
   returns { preimage, signature, attestorPubkey, tierIdxHint }.
5. dApp passes that payload + wallet address + tier + universityId
   into the prover. The prover builds a witness, runs the Compact
   circuit, and produces a ZK proof.
6. dApp asks the wallet to balance and sign the transaction, then
   submits via the wallet's submitTransaction. The transaction
   calls verifyAndRecord on the contract, which writes
   { tierIdx, universityId, expiry, attestorCommit, studentCommit }
   to the ledger.
7. Verifier opens /verify/{proofId} in the verifier portal.
   The portal queries the indexer, finds the record, renders the
   five public fields with a green check.
```

In the 6D phase the prover uses `proverSim.ts`, a simulated executor that fakes the proving and submission. The wallet still needs to connect and expose an address, but no real transaction hits the chain. Wiring the real midnight-js path is phase 7+.

## What each party sees

| Party | Sees | Cannot see |
|---|---|---|
| Bank (Plaid) | The fact that someone authorized a balance pull. The balance amount. | Which tier the student picked. Which university. The proof. The chain. |
| Attestor backend | Plaid balance for that one student. The tier hint it computes. The five field preimage it signs. | Which university the student will use the proof for. Whether the proof was ever generated or redeemed. |
| University verifier | tierIdx, universityId, expiry, attestorCommit, studentCommit. The fact that the proof verified. | The exact balance. The account or institution. The student's identity (only the commitment). The other universities the student applied to. |
| Public chain observer | The five public fields above, plus the nullifier when redeemed. | Everything else above, plus the link between proof and student. |

The attestor is the most-trusted party. It sees real bank data. The trust assumption is that it signs honestly and does not leak. In production this becomes "the bank itself signs", same shape as DKIM for email.

## Trust boundaries (where you would attack and what stops you)

**Forge a balance.** Stopped by Ed25519 signature on the preimage. The circuit aborts if the signature does not verify against a registered attestor pubkey.

**Reuse a proof at multiple universities.** Stopped by binding `universityId` into the student commitment. Same attestation can mint multiple proofs (one per recipient), each proof binds to exactly one verifier.

**Redeem the same proof twice.** Stopped by a nullifier emitted at redemption time, derived from the student commitment and a redemption secret. The contract refuses if the nullifier is already in the ledger.

**Replay yesterday's balance.** Stopped by the `expiry` field, set when the proof is generated, checked by the verifier portal. The attestor's `timestamp` field also flows into the commitment so an old attestation cannot be silently reused.

**Tamper with the public fields.** They are part of the ZK proof's public inputs. Any change fails verification at the contract.

## Why the split

The attestor is intentionally a separate service, not a circuit inside the dApp. Bank API calls cannot run in a browser (CORS, secrets, rate limits) and Plaid wants a server. The attestor is the thinnest possible shim: take token, return signed preimage. It is stateless beyond a counter for nonces.

The verifier portal is intentionally not a wallet dApp. Universities should not have to install Lace or 1AM to check a student's funds. A web page that talks to the indexer is enough.

The prover lives in the browser because the proof must run on a machine the student controls. Sending the witness (which contains the balance) to a server would defeat the privacy story.

## Stack

| Layer | Tech | Why |
|---|---|---|
| Contract | Compact 0.30.0 | Pinned to match midnight-js 4.0.4's runtime 0.15.0. See SETUP § 1. |
| Chain | Midnight Preprod | Public testnet. DUST is sponsored, no faucet needed for the demo. |
| dApp | Next.js 14, React 18, Tailwind | App router, server components where useful. Wallet talks v4 DApp Connector. |
| Attestor | NestJS 11, Fastify | DI for clean module boundaries. Ed25519 via @noble/ed25519. |
| Verifier portal | Next.js 14 | Pure client of the indexer. No wallet, no contract calls. |
| Monorepo | Turborepo + npm workspaces | Shared types package, parallel dev. |

## See also

- [wallet.md](./wallet.md) for how the prover talks to a wallet.
- [privacy.md](./privacy.md) for a longer take on what each party sees.
- [SETUP.md](../SETUP.md) for the full setup walkthrough.
