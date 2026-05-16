import { Module } from "@nestjs/common";
import { AttestorModule } from "./attestor/attestor.module.js";

@Module({
  imports: [AttestorModule],
})
export class AppModule {}
