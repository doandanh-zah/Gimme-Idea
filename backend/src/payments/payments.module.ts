import { Module } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { SupabaseService } from '../shared/supabase.service';
import { SolanaService } from '../shared/solana.service';

@Module({
  controllers: [PaymentsController],
  providers: [PaymentsService, SupabaseService, SolanaService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
