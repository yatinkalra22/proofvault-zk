import { Injectable, Logger } from "@nestjs/common";
import {
  createHash,
  generateKeyPairSync,
  KeyObject,
  randomBytes,
  sign,
} from "node:crypto";
import type { Hex32, VerifyPlaidResponse } from "./types.js";

// Tier thresholds in USD cents — must match proofvault.compact §verifyAndRecord.
const TIER_CUTOFFS = [3_000_000n, 5_000_000n, 8_000_000n] as const;

@Injectable()
export class AttestorService {
  private readonly log = new Logger(AttestorService.name);
  private readonly privateKey: KeyObject;
  private readonly publicKeyRaw: Buffer;

  constructor() {
    const { privateKey, publicKey } = generateKeyPairSync("ed25519");
    this.privateKey = privateKey;
    // Raw 32-byte form (drop the DER wrapper).
    this.publicKeyRaw = publicKey.export({ format: "der", type: "spki" }).slice(-32);
    this.log.log(
      `Boot Ed25519 attestor key — pubkey=${this.publicKeyRaw.toString("hex")}`,
    );
  }

  getPubkeyHex(): Hex32 {
    return this.publicKeyRaw.toString("hex");
  }

  // Stubbed Plaid exchange: returns a deterministic-ish demo balance regardless
  // of the public_token. Replace `lookupBalance` with a real Plaid call once
  // PLAID_CLIENT_ID / PLAID_SECRET are wired into .env.local.
  verifyPlaid(
    publicToken: string,
    walletShieldedAddress: string,
  ): VerifyPlaidResponse {
    const { balanceCents, institutionHash, accountHash } = this.lookupBalance(
      publicToken,
      walletShieldedAddress,
    );

    const balanceBytes = bigintTo32Bytes(balanceCents);
    const timestampBytes = bigintTo32Bytes(BigInt(Math.floor(Date.now() / 1000)));
    const nonce = randomBytes(32);

    const preimage: Buffer[] = [
      balanceBytes,
      accountHash,
      institutionHash,
      timestampBytes,
      nonce,
    ];

    const concatenated = Buffer.concat(preimage);
    const signature = sign(null, concatenated, this.privateKey);

    return {
      preimage: preimage.map((b) => b.toString("hex")) as VerifyPlaidResponse["preimage"],
      signature: signature.toString("hex"),
      attestorPubkey: this.publicKeyRaw.toString("hex"),
      tierIdxHint: highestTierFor(balanceCents),
    };
  }

  // Replace this with a real Plaid /accounts/balance/get call. For now, fakes a
  // 75K USD chequing balance, deterministic per public_token + wallet so repeat
  // calls with the same inputs produce the same preimage (useful for debugging).
  private lookupBalance(publicToken: string, wallet: string): {
    balanceCents: bigint;
    institutionHash: Buffer;
    accountHash: Buffer;
  } {
    if (!publicToken) {
      throw new Error("publicToken is required");
    }
    return {
      balanceCents: 7_500_000n, // $75,000.00
      institutionHash: sha256(Buffer.from(`institution:${publicToken}`)),
      accountHash: sha256(Buffer.from(`account:${publicToken}:${wallet}`)),
    };
  }
}

function bigintTo32Bytes(value: bigint): Buffer {
  if (value < 0n) {
    throw new Error("negative bigint not encodable");
  }
  const buf = Buffer.alloc(32);
  let v = value;
  for (let i = 31; i >= 0 && v > 0n; i--) {
    buf[i] = Number(v & 0xffn);
    v >>= 8n;
  }
  return buf;
}

function sha256(input: Buffer): Buffer {
  return createHash("sha256").update(input).digest();
}

function highestTierFor(balance: bigint): 0 | 1 | 2 {
  if (balance >= TIER_CUTOFFS[2]) return 2;
  if (balance >= TIER_CUTOFFS[1]) return 1;
  return 0;
}
