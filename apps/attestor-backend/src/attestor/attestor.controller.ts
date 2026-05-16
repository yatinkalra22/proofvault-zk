import { Body, Controller, Get, HttpException, HttpStatus, Post } from "@nestjs/common";
import { AttestorService } from "./attestor.service.js";
import type {
  AttestorPubkeyResponse,
  VerifyPlaidRequest,
  VerifyPlaidResponse,
} from "./types.js";

@Controller()
export class AttestorController {
  constructor(private readonly attestor: AttestorService) {}

  @Get("attestor/pubkey")
  getPubkey(): AttestorPubkeyResponse {
    return { attestorPubkey: this.attestor.getPubkeyHex() };
  }

  @Post("verify/plaid")
  verifyPlaid(@Body() body: VerifyPlaidRequest): VerifyPlaidResponse {
    if (!body?.publicToken || !body?.walletShieldedAddress) {
      throw new HttpException(
        "publicToken and walletShieldedAddress are required",
        HttpStatus.BAD_REQUEST,
      );
    }
    return this.attestor.verifyPlaid(body.publicToken, body.walletShieldedAddress);
  }
}
