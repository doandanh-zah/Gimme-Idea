import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { SupabaseService } from '../shared/supabase.service';
import { SolanaService } from '../shared/solana.service';

@Module({
  controllers: [AuthController],
  providers: [AuthService, SupabaseService, SolanaService],
  exports: [AuthService],
})
export class AuthModule {}
