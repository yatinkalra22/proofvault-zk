import {
  type CircuitContext,
  sampleContractAddress,
  createConstructorContext,
  createCircuitContext,
} from "@midnight-ntwrk/compact-runtime";
import {
  Contract,
  type Ledger,
  ledger,
} from "../managed/proofvault/contract/index.js";
import {
  type ProofVaultPrivateState,
  createProofVaultPrivateState,
  witnesses,
} from "../witnesses.js";

export class ProofVaultSimulator {
  readonly contract: Contract<ProofVaultPrivateState>;
  circuitContext: CircuitContext<ProofVaultPrivateState>;

  constructor(initialPrivateState?: Partial<ProofVaultPrivateState>) {
    this.contract = new Contract<ProofVaultPrivateState>(witnesses);
    const {
      currentPrivateState,
      currentContractState,
      currentZswapLocalState,
    } = this.contract.initialState(
      createConstructorContext(
        createProofVaultPrivateState(initialPrivateState),
        "0".repeat(64),
      ),
    );
    this.circuitContext = createCircuitContext(
      sampleContractAddress(),
      currentZswapLocalState,
      currentContractState,
      currentPrivateState,
    );
  }

  getLedger(): Ledger {
    return ledger(this.circuitContext.currentQueryContext.state);
  }

  getPrivateState(): ProofVaultPrivateState {
    return this.circuitContext.currentPrivateState;
  }
}
