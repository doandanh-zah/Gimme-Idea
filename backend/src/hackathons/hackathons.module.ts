import { Module } from "@nestjs/common";
import { HackathonsController } from "./hackathons.controller";
import { HackathonsService } from "./hackathons.service";
import { SupabaseService } from "../shared/supabase.service";
import { ApiTokensModule } from "../api-tokens/api-tokens.module";
import { AnyAuthGuard } from "../common/guards/any-auth.guard";
import { AuthGuard } from "../common/guards/auth.guard";
import { PatScopeGuard } from "../common/guards/pat-scope.guard";

@Module({
    imports: [ApiTokensModule],
    controllers: [HackathonsController],
    providers: [HackathonsService, SupabaseService, AuthGuard, AnyAuthGuard, PatScopeGuard],
    exports: [HackathonsService],
})
export class HackathonsModule { }
