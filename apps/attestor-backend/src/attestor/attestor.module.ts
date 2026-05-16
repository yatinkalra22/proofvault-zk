import { Module } from "@nestjs/common";
import { AttestorController } from "./attestor.controller.js";
import { AttestorService } from "./attestor.service.js";

@Module({
  controllers: [AttestorController],
  providers: [AttestorService],
})
export class AttestorModule {}
