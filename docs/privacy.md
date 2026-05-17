# Privacy model

The point of ProofVault is that no single party in the chain ever has the full picture. This page is the explicit list of who sees what, why, and what stops them from seeing more.

## The default world

When a student applies for a visa, a US embassy officer asks for a bank statement. The student uploads a PDF. The officer needed one number, "is this person above $50K", and got the student's entire financial life. Every paycheck. Every Zelle to their mom. Their rent. Their last DoorDash order. Their account number. The same thing happens for university enrollment, for apartment leasing, for mortgage pre-approval. The verifier always wants a yes or no. The student always hands over a memoir.

ProofVault narrows it to the yes or no.

## What each party actually sees

### The bank (via Plaid)

Sees that someone authorized a one-time balance pull. Sees the account balance at that moment. Does not see what the student plans to do with it, which tier they pick, or which university they apply to. The bank cannot link the pull to a proof on the chain because no chain data flows back to Plaid.

### The attestor backend (our service today, a bank in production)

This is the only party that ever sees the real balance number. The attestor receives a Plaid public token, exchanges it for an access token, pulls the balance, and signs a five field preimage that includes the balance in cents. The preimage and signature go back to the student's browser.

The attestor does not see which tier the student will request. It does compute a `tierIdxHint` based on which tier the balance clears, but that hint is metadata. The circuit checks the threshold independently. The attestor does not see the university either. The student never tells the attestor where the proof will go.

The attestor is intentionally stateless beyond a nonce counter. There is no log of who asked for what. We do not store balance amounts. The Ed25519 signing key is the only thing the attestor needs to keep secret.

### The prover dApp (runs in the student's browser)

Sees everything the student typed plus everything the attestor returned. This is fine because the dApp runs on the student's own machine. The witness (with the raw balance) never leaves the browser. The ZK proof is generated locally. Only the public inputs and the proof itself get submitted.

### The contract (Midnight ledger)

Sees the five public fields that come out of `verifyAndRecord`. Nothing else. The Compact circuit's witness inputs are private by construction. The chain knows that someone proved a balance above some tier for some university with some expiry. It does not know the amount, the bank, the account, or the student's identity. The `studentCommit` is a Pedersen-style commitment to the student's wallet plus a redemption secret, so it does not link to the student's wallet address publicly.

### The verifier portal (the university)

Sees the five public fields again, plus the fact that the proof verified. The university gets a clean green check that says "this person has at least $50K, can only be redeemed by us, expires in 90 days". They learn nothing else. No wallet required on their end.

### A public observer of the chain

Sees the same five fields the verifier sees, on every proof anyone has ever generated. Does not see which student each proof belongs to. Cannot link a proof to a wallet because the wallet's shielded address flows through the student commitment.

## Trust assumptions (the honest ones)

The attestor needs to be honest. It sees real balances. In production this means a bank publishes its own attestor pubkey and signs balance attestations directly. Same pattern as DKIM for email. Today, for the demo, we run the attestor ourselves.

The wallet needs to be honest. It holds the keys that derive the student commitment. A malicious wallet could leak that derivation. This is the same trust assumption as every other dApp on the chain.

The compact compiler needs to be correct. The verifier trusts that the verification key burned into the contract matches the circuit they think they are verifying. This is true of every ZK system.

The chain needs to be live and uncensored, but only for the redemption step. The proof itself does not require chain access to verify, just to anchor the nullifier and expiry.

That is the full list. Notably absent: trust in us. Notably absent: trust in the verifier. The student does not have to take our word for any of the privacy claims because the proof is publicly verifiable and the witness is never transmitted.

## Threat model

| Attack                                                                 | Defense                                                                                                                                                                                        |
| ---------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Attestor forges a balance                                              | The attestor pubkey is registered on the contract. The student has to trust the issuer, same as trusting a bank not to lie on a statement.                                                     |
| Student forges a balance                                               | The Ed25519 signature in the witness is checked by the circuit. The contract aborts if it does not verify against a registered pubkey.                                                         |
| Proof replayed at multiple universities                                | `universityId` is bound into the student commitment. A second proof requires a fresh attestation.                                                                                              |
| Proof redeemed twice at the same university                            | Nullifier emitted at redemption, derived from the student commitment plus a redemption secret. Contract refuses if the nullifier is already known.                                             |
| Old balance reused after the student's funds dropped                   | `expiry` field encodes a cutoff. Verifier portal refuses to display expired proofs. The attestor's `timestamp` also flows into the commitment so an old attestation cannot be silently reused. |
| Sybil: same student creates many wallets to inflate a per-wallet limit | Out of scope for this version. A real production system would tie the student commitment to a longer-lived KYC identity rather than just a wallet address.                                     |
| Side channel: attestor logs balances and sells them                    | Operational, not cryptographic. The whole reason banks should run their own attestors is to eliminate this party.                                                                              |

## What we deliberately do not do

We do not store balances. We do not store student identities. We do not log who asked for which tier, who linked which bank, or which university received which proof. The system is built to forget on every layer where it can.

We do not allow open-ended balance disclosure (yet). The current circuit only proves "balance is at least one of {30K, 50K, 80K}". This is a deliberate restriction. Phase 7+ extends it to arbitrary thresholds, but in a way that still hides the actual balance amount.

We do not bind to a real-world identity. The proof says "the holder of this wallet, who controls this redemption secret, has the funds". It does not say "Yatin Kalra, born in 1999". Adding identity is a future feature, and it should happen out of band (via the verifier asking for a separate identity proof) rather than smuggled into this proof.

## See also

- [architecture.md](./architecture.md) for the system-level view.
