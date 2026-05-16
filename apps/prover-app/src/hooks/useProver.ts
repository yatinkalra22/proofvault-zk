'use client';

import { useCallback, useState } from 'react';
import {
  simulateProver,
  type ProverInput,
  type ProverOutcome,
  type ProverProgress,
} from '@/lib/proverSim';

export type ProverStatus =
  | 'idle'
  | 'building'
  | 'proving'
  | 'submitting'
  | 'confirmed'
  | 'error';

export type UseProver = {
  status: ProverStatus;
  outcome: ProverOutcome | null;
  error: string | null;
  provingElapsedMs: number;
  start: (input: ProverInput) => Promise<void>;
  reset: () => void;
};

export function useProver(): UseProver {
  const [status, setStatus] = useState<ProverStatus>('idle');
  const [outcome, setOutcome] = useState<ProverOutcome | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [provingElapsedMs, setProvingElapsedMs] = useState(0);

  const onProgress = useCallback((p: ProverProgress) => {
    setStatus(p.phase);
    if (p.phase === 'proving') setProvingElapsedMs(p.elapsedMs);
  }, []);

  const start = useCallback(
    async (input: ProverInput) => {
      setStatus('building');
      setError(null);
      setOutcome(null);
      setProvingElapsedMs(0);
      try {
        const res = await simulateProver(input, onProgress);
        setOutcome(res);
        setStatus('confirmed');
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
        setStatus('error');
      }
    },
    [onProgress],
  );

  const reset = useCallback(() => {
    setStatus('idle');
    setOutcome(null);
    setError(null);
    setProvingElapsedMs(0);
  }, []);

  return { status, outcome, error, provingElapsedMs, start, reset };
}
