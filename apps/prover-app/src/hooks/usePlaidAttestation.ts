'use client';

import { useCallback, useState } from 'react';
import type { VerifyPlaidResponse } from '@proofvault/shared-types';
import { verifyPlaid } from '@/lib/attestor';

export type AttestStatus = 'idle' | 'linking' | 'attested' | 'error';

export type UsePlaidAttestation = {
  status: AttestStatus;
  payload: VerifyPlaidResponse | null;
  error: string | null;
  link: (walletShieldedAddress: string) => Promise<void>;
  reset: () => void;
};

// Real Plaid Link integration lands once PLAID_CLIENT_ID/SECRET are wired —
// for now the attestor backend returns the same stubbed $75K balance regardless
// of the publicToken, so we ship a placeholder token from the dApp.
const SANDBOX_PUBLIC_TOKEN = 'public-sandbox-proofvault-demo';

export function usePlaidAttestation(): UsePlaidAttestation {
  const [status, setStatus] = useState<AttestStatus>('idle');
  const [payload, setPayload] = useState<VerifyPlaidResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const link = useCallback(async (walletShieldedAddress: string) => {
    setStatus('linking');
    setError(null);
    try {
      const res = await verifyPlaid({
        publicToken: SANDBOX_PUBLIC_TOKEN,
        walletShieldedAddress,
      });
      setPayload(res);
      setStatus('attested');
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setStatus('error');
    }
  }, []);

  const reset = useCallback(() => {
    setStatus('idle');
    setPayload(null);
    setError(null);
  }, []);

  return { status, payload, error, link, reset };
}
