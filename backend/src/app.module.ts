import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ThrottlerModule, ThrottlerGuard } from "@nestjs/throttler";
import { APP_GUARD } from "@nestjs/core";
import { AppController } from "./app.controller";
import { SupabaseService } from "./shared/supabase.service";
import { SolanaService } from "./shared/solana.service";
import { AuthModule } from "./auth/auth.module";
import { ProjectsModule } from "./projects/projects.module";
import { CommentsModule } from "./comments/comments.module";
import { UsersModule } from "./users/users.module";
import { PaymentsModule } from "./payments/payments.module";
import { SettingsModule } from "./settings/settings.module";
import { AIModule } from "./ai/ai.module";
import { FeedsModule } from "./feeds/feeds.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    // Rate limiting: 100 requests per 60 seconds per IP
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 60 seconds
        limit: 100, // 100 requests
      },
    ]),
    AuthModule,
    UsersModule,
    ProjectsModule,
    CommentsModule,
    PaymentsModule,
    SettingsModule,
    AIModule,
    FeedsModule,
  ],
  controllers: [AppController],
  providers: [
    SupabaseService,
    SolanaService,
    // Apply rate limiting globally
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
  exports: [SupabaseService, SolanaService],
})
export class AppModule {}
