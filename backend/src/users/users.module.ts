import { Module } from "@nestjs/common";
import { UsersController } from "./users.controller";
import { UsersService } from "./users.service";
import { FollowController } from "./follow.controller";
import { FollowService } from "./follow.service";
import { NotificationController } from "./notification.controller";
import { NotificationService } from "./notification.service";
import { SupabaseService } from "../shared/supabase.service";
import { ApiTokensModule } from "../api-tokens/api-tokens.module";
import { AnyAuthGuard } from "../common/guards/any-auth.guard";
import { AuthGuard } from "../common/guards/auth.guard";
import { PatScopeGuard } from "../common/guards/pat-scope.guard";

@Module({
  imports: [ApiTokensModule],
  controllers: [UsersController, FollowController, NotificationController],
  providers: [
    UsersService,
    FollowService,
    NotificationService,
    SupabaseService,
    AuthGuard,
    AnyAuthGuard,
    PatScopeGuard,
  ],
  exports: [UsersService, FollowService, NotificationService],
})
export class UsersModule {}
