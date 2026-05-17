type Params = { proofId: string };

const PROVER_BASE =
  process.env.NEXT_PUBLIC_PROVER_BASE_URL?.replace(/\/$/, "") ??
  "http://localhost:3000";

function shortHex(s: string, head = 14, tail = 8): string {
  if (s.length <= head + tail + 1) return s;
  return `${s.slice(0, head)}…${s.slice(-tail)}`;
}

export default function VerifyPage({ params }: { params: Params }) {
  const { proofId } = params;

  return (
    <main className="min-h-screen px-6 py-16 sm:py-20 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-3 h-3 rounded-full bg-cyan-electric shadow-glow" />
        <span className="font-mono text-xs uppercase tracking-widest text-cyan-electric">
          ProofVault Verifier
        </span>
      </div>

      <h1 className="text-4xl sm:text-5xl font-semibold leading-tight">
        Coming soon.
      </h1>
      <p className="mt-4 text-slate-300 max-w-xl">
        This is the page a university or visa officer will open to verify a
        ProofVault credential. The current build wires up the prover flow end
        to end, but on-chain verification lights up in phase 7.
      </p>

      <section className="mt-10 rounded-lg border border-cyan-electric/40 bg-navy-900 shadow-glow p-5 space-y-4">
        <div className="flex items-center justify-between">
          <span className="font-mono text-xs text-cyan-electric uppercase tracking-widest">
            Pending proof
          </span>
          <span className="font-mono text-[10px] text-slate-500">
            ID {shortHex(proofId)}
          </span>
        </div>

        <p className="text-sm text-slate-300">
          When the chain integration ships, opening this URL will do all of the
          following without revealing the student&apos;s balance, account,
          institution, or identity:
        </p>

        <ul className="font-mono text-xs text-slate-300 space-y-2">
          <li>
            <span className="text-cyan-electric">1.</span> Read the proof record
            from the Midnight indexer by <code>proofId</code>.
          </li>
          <li>
            <span className="text-cyan-electric">2.</span> Verify the public
            fields against the contract&apos;s ledger:{" "}
            <code>tierIdx</code>, <code>universityId</code>,{" "}
            <code>expiry</code>, <code>attestorCommit</code>,{" "}
            <code>studentCommit</code>.
          </li>
          <li>
            <span className="text-cyan-electric">3.</span> Check that the proof
            has not expired and has not been redeemed already (nullifier check).
          </li>
          <li>
            <span className="text-cyan-electric">4.</span> Render a green
            checkmark with the tier the student met, the university the proof is
            bound to, and the expiry date. Nothing else.
          </li>
        </ul>
      </section>

      <section className="mt-8 rounded-lg border border-navy-700 bg-navy-900 p-4 space-y-2">
        <div className="font-mono text-xs uppercase tracking-widest text-slate-400">
          What it will not show
        </div>
        <ul className="text-sm text-slate-300 space-y-1 list-disc list-inside">
          <li>The actual balance amount.</li>
          <li>The bank or account the funds sit in.</li>
          <li>The student&apos;s identity or wallet address.</li>
          <li>Other universities the student may have applied to.</li>
        </ul>
      </section>

      <section className="mt-8 rounded-lg border border-navy-700 bg-navy-950 p-4">
        <div className="font-mono text-xs uppercase tracking-widest text-slate-500 mb-2">
          Current status
        </div>
        <p className="text-sm text-slate-300">
          The proof you generated has been recorded inside the prover app, but
          chain submission is simulated in this build. The shareable URL pattern
          is final. The indexer read and contract verification happen next.
        </p>
      </section>

      <div className="mt-10">
        <a
          href={PROVER_BASE}
          className="font-mono text-xs text-slate-400 hover:text-cyan-electric transition"
        >
          ← Back to the prover dApp
        </a>
      </div>
    </main>
  );
}
