// Simulated proof-generation executor. Returns a deterministic proofId so the
// demo flow is reliable on stage regardless of midnight-js / Lace state.
//
// Real implementation will swap this out for a midnight-js verifyAndRecord
// call (browser-side, witnesses stay local). When the real executor lands,
// its public surface should be drop-in compatible with `simulateProver`.

import type { VerifyPlaidResponse } from '@proofvault/shared-types';

export type ProverInput = {
  walletShieldedAddress: string;
  universityId: string;
  tierIdx: 0 | 1 | 2;
  attestation: VerifyPlaidResponse;
  expirySecondsFromNow?: number; // default 90 days
};

export type ProverProgress =
  | { phase: 'building' }
  | { phase: 'proving'; elapsedMs: number }
  | { phase: 'submitting' };

export type ProverOutcome = {
  proofId: string; // 64-char lowercase hex
  txHash: string; // 64-char lowercase hex
  expiryUnixSeconds: number;
  tierIdx: 0 | 1 | 2;
  universityId: string;
  attestorCommit: string;
  studentCommit: string;
  provingMs: number;
};

const PHASE_DURATIONS_MS = {
  building: 800,
  proving: 3500,
  submitting: 1200,
} as const;

export async function simulateProver(
  input: ProverInput,
  onProgress?: (p: ProverProgress) => void,
): Promise<ProverOutcome> {
  onProgress?.({ phase: 'building' });
  await delay(PHASE_DURATIONS_MS.building);

  const provingStart = Date.now();
  onProgress?.({ phase: 'proving', elapsedMs: 0 });
  // Tick the proving timer every 500ms so the UI can show elapsed.
  const tick = setInterval(() => {
    onProgress?.({ phase: 'proving', elapsedMs: Date.now() - provingStart });
  }, 500);
  await delay(PHASE_DURATIONS_MS.proving);
  clearInterval(tick);
  const provingMs = Date.now() - provingStart;

  onProgress?.({ phase: 'submitting' });
  await delay(PHASE_DURATIONS_MS.submitting);

  const expiryUnixSeconds =
    Math.floor(Date.now() / 1000) + (input.expirySecondsFromNow ?? 90 * 24 * 3600);

  // proofId = sha256(wallet || universityId || tierIdx || preimage[4] nonce)
  const proofId = await hashHex(
    `${input.walletShieldedAddress}|${input.universityId}|${input.tierIdx}|${input.attestation.preimage[4]}`,
  );
  const txHash = await hashHex(`tx|${proofId}|${Date.now()}`);
  // attestorCommit = sha256 of the 5-tuple preimage joined — matches the on-chain
  // persistentHash domain by *shape* even if not by hash function. Good enough
  // for the simulated card; real path will read it back from the ledger.
  const attestorCommit = await hashHex(input.attestation.preimage.join('|'));
  const studentCommit = await hashHex(
    `student|${input.walletShieldedAddress}|${input.attestation.preimage[4]}`,
  );

  return {
    proofId,
    txHash,
    expiryUnixSeconds,
    tierIdx: input.tierIdx,
    universityId: input.universityId,
    attestorCommit,
    studentCommit,
    provingMs,
  };
}

function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

async function hashHex(input: string): Promise<string> {
  const bytes = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest)]
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}
