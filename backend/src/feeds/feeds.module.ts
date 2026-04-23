import { Module } from '@nestjs/common';
import { FeedsService } from './feeds.service';
import { FeedsController } from './feeds.controller';
import { SupabaseService } from '../shared/supabase.service';
import { ApiTokensModule } from '../api-tokens/api-tokens.module';
import { AnyAuthGuard } from '../common/guards/any-auth.guard';
import { AuthGuard } from '../common/guards/auth.guard';
import { OptionalAuthGuard } from '../common/guards/optional-auth.guard';
import { PatScopeGuard } from '../common/guards/pat-scope.guard';

@Module({
  imports: [ApiTokensModule],
  controllers: [FeedsController],
  providers: [FeedsService, SupabaseService, AuthGuard, AnyAuthGuard, OptionalAuthGuard, PatScopeGuard],
  exports: [FeedsService],
})
export class FeedsModule {}
