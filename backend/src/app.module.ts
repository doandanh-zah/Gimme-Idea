import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SupabaseService } from './shared/supabase.service';
import { SolanaService } from './shared/solana.service';
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
  providers: [SupabaseService, SolanaService],
  exports: [SupabaseService, SolanaService],
})
export class AppModule {}
