import { Module } from '@nestjs/common';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';
import { SupabaseService } from '../shared/supabase.service';
import { AIService } from '../ai/ai.service';
import { AuthGuard } from '../common/guards/auth.guard';
import { AnyAuthGuard } from '../common/guards/any-auth.guard';
import { ApiTokensModule } from '../api-tokens/api-tokens.module';

@Module({
  imports: [ApiTokensModule],
  controllers: [ProjectsController],
  providers: [ProjectsService, SupabaseService, AIService, AuthGuard, AnyAuthGuard],
  exports: [ProjectsService],
})
export class ProjectsModule {}
