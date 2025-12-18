import { Module } from "@nestjs/common";
import { HackathonsController } from "./hackathons.controller";
import { HackathonsService } from "./hackathons.service";
import { SupabaseService } from "../shared/supabase.service";
import { AuthGuard } from "../common/guards/auth.guard";

@Module({
    controllers: [HackathonsController],
    providers: [HackathonsService, SupabaseService, AuthGuard],
    exports: [HackathonsService],
})
export class HackathonsModule { }
