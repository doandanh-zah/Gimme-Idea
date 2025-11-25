import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { SupabaseService } from './shared/supabase.service';
import { SolanaService } from './shared/solana.service';
import { AIService } from './shared/ai.service';
import { AuthModule } from './auth/auth.module';
import { ProjectsModule } from './projects/projects.module';
import { CommentsModule } from './comments/comments.module';
import { UsersModule } from './users/users.module';
import { PaymentsModule } from './payments/payments.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    AuthModule,
    ProjectsModule,
    CommentsModule,
    UsersModule,
    PaymentsModule,
  ],
  controllers: [AppController],
  providers: [SupabaseService, SolanaService, AIService],
  exports: [SupabaseService, SolanaService, AIService],
})
export class AppModule {}
