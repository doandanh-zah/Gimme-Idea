import { Module } from '@nestjs/common';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';
import { SupabaseService } from '../shared/supabase.service';
import { AIService } from '../ai/ai.service';

@Module({
  controllers: [ProjectsController],
  providers: [ProjectsService, SupabaseService, AIService],
  exports: [ProjectsService],
})
export class ProjectsModule {}
