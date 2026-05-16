// Wire types are now owned by @proofvault/shared-types so the prover-app
// imports the exact same definitions. This file is kept as a thin re-export
// so the existing controller/service imports don't need to change.

export type {
  Hex32,
  VerifyPlaidRequest,
  VerifyPlaidResponse,
  AttestorPubkeyResponse,
} from "@proofvault/shared-types";
