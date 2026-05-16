// Wire types shared by attestor controller, service, and (later) prover-app.
//
// The on-chain contract expects the attestation preimage as a 5-element
// Vector<Bytes<32>>. We mirror that shape exactly so the prover-app can hand
// the array straight into the witness without reshuffling.

export type Hex32 = string; // 64-char lowercase hex (32 bytes)

export interface VerifyPlaidRequest {
  publicToken: string;
  walletShieldedAddress: string;
}

export interface VerifyPlaidResponse {
  // [balanceBytes, accountHash, institutionHash, timestampBytes, nonce]
  preimage: [Hex32, Hex32, Hex32, Hex32, Hex32];
  signature: string; // hex Ed25519 signature over concatenated preimage
  attestorPubkey: Hex32; // hex Ed25519 raw public key
  tierIdxHint: 0 | 1 | 2; // suggested tier based on balance — prover may downgrade
}

export interface AttestorPubkeyResponse {
  attestorPubkey: Hex32;
}
