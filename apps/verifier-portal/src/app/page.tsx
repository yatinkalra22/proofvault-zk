export default function Home() {
  return (
    <main className="min-h-screen px-6 py-20 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-3 h-3 rounded-full bg-cyan-electric shadow-glow" />
        <span className="font-mono text-xs uppercase tracking-widest text-cyan-electric">
          ProofVault Verifier
        </span>
      </div>
      <h1 className="text-4xl font-semibold leading-tight">
        Open a proof URL to verify a credential.
      </h1>
      <p className="mt-4 text-slate-300">
        This portal is opened by universities, landlords, or visa officers. They
        click a link the student sends, and see a checkmark with the public fields
        the proof commits to. Nothing else is disclosed.
      </p>
      <p className="mt-6 text-sm text-slate-400">
        Visit a URL of the form <code className="font-mono text-cyan-electric">/verify/&#123;proofId&#125;</code> to
        see a sample verification page.
      </p>
    </main>
  );
}
