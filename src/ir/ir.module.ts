import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { IrController } from "./ir.controller";
import { IrService } from "./ir.service";

@Module({
	imports: [ConfigModule],
	controllers: [IrController],
	providers: [IrService],
})
export class IrModule {}
