import { Module } from '@nestjs/common';
import { CommentsController } from './comments.controller';
import { CommentsService } from './comments.service';
import { SupabaseService } from '../shared/supabase.service';

@Module({
  controllers: [CommentsController],
  providers: [CommentsService, SupabaseService],
  exports: [CommentsService],
})
export class CommentsModule {}
