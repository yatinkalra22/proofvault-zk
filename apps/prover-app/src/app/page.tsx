'use client';

import { useState } from 'react';
import { useLaceWallet, type LaceStatus } from '@/hooks/useLaceWallet';
import { truncateAddress } from '@/lib/lace';

type Tier = { idx: 0 | 1 | 2; label: string; thresholdUsd: number };

const TIERS: Tier[] = [
  { idx: 0, label: '$30K', thresholdUsd: 30_000 },
  { idx: 1, label: '$50K', thresholdUsd: 50_000 },
  { idx: 2, label: '$80K', thresholdUsd: 80_000 },
];

const UNIVERSITIES = [
  { id: 'northeastern', name: 'Northeastern University' },
  { id: 'ut-austin', name: 'University of Texas at Austin' },
  { id: 'stanford', name: 'Stanford University' },
];

export default function Home() {
  const [tierIdx, setTierIdx] = useState<0 | 1 | 2>(1);
  const [universityId, setUniversityId] = useState(UNIVERSITIES[0]!.id);
  const wallet = useLaceWallet();

  const ready = wallet.status === 'connected' && universityId;

  return (
    <main className="min-h-screen px-6 py-12 sm:py-20 max-w-3xl mx-auto">
      <header className="mb-12">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-3 h-3 rounded-full bg-cyan-electric shadow-glow" />
          <span className="font-mono text-xs uppercase tracking-widest text-cyan-electric">
            ProofVault · Midnight Network
          </span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-semibold leading-tight">
          Prove your funds.
          <br />
          <span className="text-cyan-electric">Reveal nothing.</span>
        </h1>
        <p className="mt-4 text-slate-300 max-w-xl">
          Generate a zero-knowledge credential that proves your bank balance meets a tier — for
          visas, housing, university enrollment — without disclosing the amount, the account, or the
          bank.
        </p>
      </header>

      <section className="space-y-8">
        <div>
          <h2 className="text-sm font-mono uppercase tracking-widest text-slate-400 mb-3">
            1. Pick a tier
          </h2>
          <div className="grid grid-cols-3 gap-3">
            {TIERS.map((tier) => {
              const active = tierIdx === tier.idx;
              return (
                <button
                  key={tier.idx}
                  type="button"
                  onClick={() => setTierIdx(tier.idx)}
                  className={`rounded-lg border px-4 py-5 text-left transition ${
                    active
                      ? 'border-cyan-electric bg-navy-800 shadow-glow'
                      : 'border-navy-700 bg-navy-900 hover:border-navy-700/80'
                  }`}
                >
                  <div className="font-mono text-2xl font-semibold">{tier.label}</div>
                  <div className="text-xs text-slate-400 mt-1">
                    Prove balance ≥ ${tier.thresholdUsd.toLocaleString()}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <h2 className="text-sm font-mono uppercase tracking-widest text-slate-400 mb-3">
            2. Bind to a university
          </h2>
          <select
            value={universityId}
            onChange={(e) => setUniversityId(e.target.value)}
            className="w-full rounded-lg border border-navy-700 bg-navy-900 px-4 py-3 font-mono text-sm focus:border-cyan-electric focus:outline-none"
          >
            {UNIVERSITIES.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>
          <p className="mt-2 text-xs text-slate-500">
            Binding the proof to a recipient means the credential can only be redeemed by that
            institution.
          </p>
        </div>

        <div className="pt-4 space-y-3">
          <WalletButton wallet={wallet} />
          <button
            type="button"
            disabled={!ready}
            className="w-full rounded-lg border border-cyan-electric/40 bg-cyan-electric/10 px-4 py-3 font-mono text-sm text-cyan-electric disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Generate proof
          </button>
          {wallet.error && <p className="text-xs text-red-400 font-mono">{wallet.error}</p>}
        </div>
      </section>

      <footer className="mt-20 text-xs text-slate-500 font-mono">
        Selected · tier {tierIdx} · {universityId} · wallet {wallet.status}
      </footer>
    </main>
  );
}

function WalletButton({ wallet }: { wallet: ReturnType<typeof useLaceWallet> }) {
  if (wallet.status === 'connected' && wallet.address) {
    return (
      <div className="w-full rounded-lg border border-cyan-electric/40 bg-navy-900 px-4 py-3 font-mono text-sm flex items-center justify-between">
        <span className="text-cyan-electric">● Connected</span>
        <span className="text-slate-300 text-xs" title={wallet.address}>
          {truncateAddress(wallet.address)}
        </span>
      </div>
    );
  }

  if (wallet.status === 'unavailable') {
    return (
      <a
        href="https://chromewebstore.google.com/detail/lace/gafhhkghbfjjkeiendhlofajokpaflmk"
        target="_blank"
        rel="noreferrer"
        className="block w-full rounded-lg border border-amber-400/40 bg-amber-400/10 px-4 py-3 font-mono text-sm text-amber-300 text-center"
      >
        Install Lace 2.0 wallet →
      </a>
    );
  }

  const labels: Record<LaceStatus, string> = {
    checking: 'Checking for Lace…',
    disconnected: 'Connect Lace wallet',
    connecting: 'Connecting…',
    connected: 'Connected',
    unavailable: 'Install Lace 2.0 wallet',
    error: 'Retry connect',
  };

  const busy = wallet.status === 'checking' || wallet.status === 'connecting';

  return (
    <button
      type="button"
      onClick={wallet.connect}
      disabled={busy}
      className="w-full rounded-lg border border-cyan-electric/40 bg-navy-800 hover:bg-navy-700 transition px-4 py-3 font-mono text-sm text-cyan-electric disabled:opacity-50 disabled:cursor-wait"
    >
      {labels[wallet.status]}
    </button>
  );
}
