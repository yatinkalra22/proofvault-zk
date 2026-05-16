import { setNetworkId } from "@midnight-ntwrk/midnight-js-network-id";
import { describe, expect, it } from "vitest";
import { ProofVaultSimulator } from "./proofvault-simulator.js";

setNetworkId("undeployed");

describe("ProofVault smart contract", () => {
  it("two fresh simulators see the same public ledger snapshot", () => {
    const a = new ProofVaultSimulator().getLedger();
    const b = new ProofVaultSimulator().getLedger();
    expect(a.round).toEqual(b.round);
    expect(a.attestorCommitRoot.field).toEqual(b.attestorCommitRoot.field);
    expect(a.nullifiers.size()).toEqual(b.nullifiers.size());
    expect(a.proofs.size()).toEqual(b.proofs.size());
  });

  it("starts with round = 1 (constructor increments)", () => {
    const sim = new ProofVaultSimulator();
    expect(sim.getLedger().round).toEqual(1n);
  });

  it("starts with empty nullifiers and proofs maps", () => {
    const sim = new ProofVaultSimulator();
    const ledger = sim.getLedger();
    expect(ledger.nullifiers.isEmpty()).toBe(true);
    expect(ledger.proofs.isEmpty()).toBe(true);
    expect(ledger.nullifiers.size()).toEqual(0n);
    expect(ledger.proofs.size()).toEqual(0n);
  });

  it("starts with zeroed attestorCommitRoot", () => {
    const sim = new ProofVaultSimulator();
    expect(sim.getLedger().attestorCommitRoot.field).toEqual(0n);
  });

  it("threads private state through the witness layer", () => {
    const balance = 7_500_000n;
    const tierIdx = 1n;
    const sim = new ProofVaultSimulator({ balance, tierIdx });
    expect(sim.getPrivateState().balance).toEqual(balance);
    expect(sim.getPrivateState().tierIdx).toEqual(tierIdx);
  });
});
