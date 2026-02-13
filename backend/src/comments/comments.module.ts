import { Module } from '@nestjs/common';
import { CommentsController } from './comments.controller';
import { CommentsService } from './comments.service';
import { SupabaseService } from '../shared/supabase.service';
import { AuthGuard } from '../common/guards/auth.guard';
import { AnyAuthGuard } from '../common/guards/any-auth.guard';
import { ApiTokensModule } from '../api-tokens/api-tokens.module';

@Module({
  imports: [ApiTokensModule],
  controllers: [CommentsController],
  providers: [CommentsService, SupabaseService, AuthGuard, AnyAuthGuard],
  exports: [CommentsService],
})
export class CommentsModule {}
