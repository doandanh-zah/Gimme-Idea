import { Controller, Get, Post, Body, Param, UseGuards, Request, Query } from '@nestjs/common';
import { HackathonService } from './hackathon.service';
import { CreateTeamDto, JoinTeamDto, SubmitProjectDto } from './dto/hackathon.dto';
import { AuthGuard } from '../common/guards/auth.guard';
import { OptionalAuthGuard } from '../common/guards/optional-auth.guard';

@Controller('hackathons')
export class HackathonController {
  constructor(private readonly hackathonService: HackathonService) {}

  @Get()
  findAll() {
    return this.hackathonService.findAll();
  }

  @Get('check-data')
  async checkData() {
    // Debug endpoint to verify DB connection and data existence
    const data = await this.hackathonService.findAll();
    return {
      count: data?.length || 0,
      firstItem: data?.[0] || null,
      message: data?.length ? "Data found" : "No data found in DB"
    };
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.hackathonService.findOne(id);
  }

  @Get(':id/announcements')
  getAnnouncements(@Param('id') id: string) {
    return this.hackathonService.getAnnouncements(id);
  }

  @Get(':id/teams')
  getTeams(@Param('id') id: string) {
    return this.hackathonService.getTeams(id);
  }

  @UseGuards(OptionalAuthGuard)
  @Get(':id/my-status')
  async getMyStatus(@Param('id') id: string, @Request() req) {
    if (!req.user) return { status: null, team: null };
    
    const [status, team] = await Promise.all([
       this.hackathonService.getParticipantStatus(req.user.uid, id),
       this.hackathonService.getUserTeam(req.user.uid, id)
    ]);

    return { participant: status, team };
  }

  @UseGuards(AuthGuard)
  @Post(':id/register')
  register(@Param('id') id: string, @Request() req) {
    return this.hackathonService.register(req.user.uid, id);
  }

  @UseGuards(AuthGuard)
  @Post(':id/teams')
  createTeam(@Param('id') id: string, @Body() dto: CreateTeamDto, @Request() req) {
    return this.hackathonService.createTeam(req.user.uid, id, dto);
  }

  @UseGuards(AuthGuard)
  @Post(':id/teams/join')
  joinTeam(@Body() dto: JoinTeamDto, @Request() req) {
    return this.hackathonService.joinTeam(req.user.uid, dto.teamId);
  }

  @UseGuards(AuthGuard)
  @Post(':id/submit')
  submitProject(@Param('id') id: string, @Body() dto: SubmitProjectDto, @Request() req) {
    // Ensure hackathonId in dto matches param for safety
    dto.hackathonId = id;
    return this.hackathonService.submitProject(req.user.uid, dto);
  }
}
