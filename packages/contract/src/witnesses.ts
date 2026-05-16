import type { WitnessContext } from "@midnight-ntwrk/compact-runtime";
import type {
  Ledger,
  Witnesses,
} from "./managed/proofvault/contract/index.js";

export type ProofVaultPrivateState = {
  balance: bigint;
  attestationPreimage: Uint8Array[];
  attestorPath: {
    leaf: Uint8Array;
    path: { sibling: { field: bigint }; goes_left: boolean }[];
  };
  studentSecret: Uint8Array;
  tierIdx: bigint;
  nonce: Uint8Array;
};

export const createProofVaultPrivateState = (
  init: Partial<ProofVaultPrivateState> = {},
): ProofVaultPrivateState => {
  const zero32 = new Uint8Array(32);
  return {
    balance: 0n,
    attestationPreimage: [zero32, zero32, zero32, zero32, zero32],
    attestorPath: {
      leaf: zero32,
      path: Array.from({ length: 10 }, () => ({
        sibling: { field: 0n },
        goes_left: false,
      })),
    },
    studentSecret: zero32,
    tierIdx: 0n,
    nonce: zero32,
    ...init,
  };
};

type Ctx = WitnessContext<Ledger, ProofVaultPrivateState>;

export const witnesses: Witnesses<ProofVaultPrivateState> = {
  getBalance: ({ privateState }: Ctx): [ProofVaultPrivateState, bigint] => [
    privateState,
    privateState.balance,
  ],
  getAttestationPreimage: ({
    privateState,
  }: Ctx): [ProofVaultPrivateState, Uint8Array[]] => [
    privateState,
    privateState.attestationPreimage,
  ],
  getAttestorPath: ({
    privateState,
  }: Ctx): [ProofVaultPrivateState, ProofVaultPrivateState["attestorPath"]] => [
    privateState,
    privateState.attestorPath,
  ],
  getStudentSecret: ({
    privateState,
  }: Ctx): [ProofVaultPrivateState, Uint8Array] => [
    privateState,
    privateState.studentSecret,
  ],
  getTierIdx: ({ privateState }: Ctx): [ProofVaultPrivateState, bigint] => [
    privateState,
    privateState.tierIdx,
  ],
  getNonce: ({ privateState }: Ctx): [ProofVaultPrivateState, Uint8Array] => [
    privateState,
    privateState.nonce,
  ],
};
