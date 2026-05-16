// Typed client for the attestor backend (apps/attestor-backend). Wire types
// live in @proofvault/shared-types so backend and frontend stay in lockstep.

import type {
  AttestorPubkeyResponse,
  VerifyPlaidRequest,
  VerifyPlaidResponse,
} from '@proofvault/shared-types';

const BASE_URL =
  process.env.NEXT_PUBLIC_ATTESTOR_URL?.replace(/\/$/, '') ??
  'http://localhost:4000';

export async function fetchAttestorPubkey(): Promise<AttestorPubkeyResponse> {
  const res = await fetch(`${BASE_URL}/attestor/pubkey`, { cache: 'no-store' });
  if (!res.ok) {
    throw new Error(`attestor pubkey fetch failed: ${res.status} ${res.statusText}`);
  }
  return res.json() as Promise<AttestorPubkeyResponse>;
}

export async function verifyPlaid(
  req: VerifyPlaidRequest,
): Promise<VerifyPlaidResponse> {
  const res = await fetch(`${BASE_URL}/verify/plaid`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
    cache: 'no-store',
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(
      `attestor /verify/plaid failed: ${res.status} ${res.statusText}${
        detail ? ` — ${detail}` : ''
      }`,
    );
  }
  return res.json() as Promise<VerifyPlaidResponse>;
}

// --- decode helpers for displaying preimage components in the UI ---

export function decodeBalanceCents(hex32: string): bigint {
  return BigInt(`0x${hex32}`);
}

export function formatUsd(cents: bigint): string {
  const whole = cents / 100n;
  const frac = cents % 100n;
  return `$${whole.toLocaleString()}.${frac.toString().padStart(2, '0')}`;
}

export function decodeUnixSeconds(hex32: string): Date {
  return new Date(Number(BigInt(`0x${hex32}`)) * 1000);
}

export function truncateHex(hex: string, head = 10, tail = 6): string {
  if (hex.length <= head + tail + 1) return hex;
  return `${hex.slice(0, head)}…${hex.slice(-tail)}`;
}

export const TIER_LABELS = ['$30K', '$50K', '$80K'] as const;
