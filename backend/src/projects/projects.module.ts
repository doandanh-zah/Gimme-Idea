import { Module } from '@nestjs/common';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';
import { SupabaseService } from '../shared/supabase.service';

@Module({
  controllers: [ProjectsController],
  providers: [ProjectsService, SupabaseService],
  exports: [ProjectsService],
})
export class ProjectsModule {}
