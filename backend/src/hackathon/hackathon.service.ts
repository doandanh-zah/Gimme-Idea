import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../shared/supabase.service';
import { CreateHackathonDto, CreateTeamDto, SubmitProjectDto } from './dto/hackathon.dto';

@Injectable()
export class HackathonService {
  constructor(private readonly supabase: SupabaseService) {}

  private get db() {
    try {
      return this.supabase.getAdminClient();
    } catch (e) {
      // Fallback to public client if admin client is not configured (e.g. missing SERVICE_KEY)
      // This prevents server crash, though some admin-only operations might fail later if RLS blocks them.
      return this.supabase.getClient();
    }
  }

  // --- Hackathon Core ---

  async findAll() {
    const { data, error } = await this.db
      .from('hackathons')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw new BadRequestException(error.message);
    return data;
  }

  async findOne(id: string) {
    const { data, error } = await this.db
      .from('hackathons')
      .select(`
        *,
        participants:hackathon_participants(count),
        teams:hackathon_teams(count)
      `)
      .eq('id', id)
      .single();

    if (error) throw new NotFoundException('Hackathon not found');
    return data;
  }

  async getAnnouncements(hackathonId: string) {
    const { data, error } = await this.db
      .from('hackathon_announcements')
      .select('*')
      .eq('hackathon_id', hackathonId)
      .order('published_at', { ascending: true }); // Terminal style logs usually append bottom

    if (error) throw new BadRequestException(error.message);
    return data;
  }

  // --- Participation ---

  async register(userId: string, hackathonId: string) {
    // Check if already registered
    const { data: existing } = await this.db
      .from('hackathon_participants')
      .select('status')
      .eq('hackathon_id', hackathonId)
      .eq('user_id', userId)
      .single();

    if (existing) throw new BadRequestException('Already registered');

    const { data, error } = await this.db
      .from('hackathon_participants')
      .insert({
        hackathon_id: hackathonId,
        user_id: userId,
        status: 'registered'
      })
      .select()
      .single();

    if (error) throw new BadRequestException(error.message);
    return data;
  }

  async getParticipantStatus(userId: string, hackathonId: string) {
    const { data } = await this.db
      .from('hackathon_participants')
      .select('*')
      .eq('hackathon_id', hackathonId)
      .eq('user_id', userId)
      .single();
    
    return data || null;
  }

  // --- Teams ---

  async getTeams(hackathonId: string) {
    const { data, error } = await this.db
      .from('hackathon_teams')
      .select('*, members:hackathon_team_members(*, user:users(username, avatar))')
      .eq('hackathon_id', hackathonId);

    if (error) throw new BadRequestException(error.message);
    return data;
  }

  async createTeam(userId: string, hackathonId: string, dto: CreateTeamDto) {
    // 1. Create Team
    const { data: team, error: teamError } = await this.db
      .from('hackathon_teams')
      .insert({
        hackathon_id: hackathonId,
        name: dto.name,
        description: dto.description,
        tags: dto.tags,
        looking_for: dto.lookingFor,
        max_members: dto.maxMembers,
        created_by: userId
      })
      .select()
      .single();

    if (teamError) throw new BadRequestException(teamError.message);

    // 2. Add Creator as Leader
    const { error: memberError } = await this.db
      .from('hackathon_team_members')
      .insert({
        team_id: team.id,
        user_id: userId,
        role: 'Leader',
        is_leader: true
      });

    if (memberError) {
      // Rollback team creation (manual since no transactional support in simple supabase-js client easily accessible here without RPC)
      await this.db.from('hackathon_teams').delete().eq('id', team.id);
      throw new BadRequestException('Failed to add leader to team');
    }

    return team;
  }

  async joinTeam(userId: string, teamId: string) {
    // Check if team exists and is not full
    const { data: team } = await this.db.from('hackathon_teams').select('id, max_members').eq('id', teamId).single();
    if (!team) throw new NotFoundException('Team not found');

    const { count } = await this.db.from('hackathon_team_members').select('*', { count: 'exact', head: true }).eq('team_id', teamId);
    
    if (count !== null && count >= team.max_members) {
      throw new BadRequestException('Team is full');
    }

    const { error } = await this.db
      .from('hackathon_team_members')
      .insert({
        team_id: teamId,
        user_id: userId,
        role: 'Member'
      });

    if (error) throw new BadRequestException(error.message);
    return { success: true };
  }

  async getUserTeam(userId: string, hackathonId: string) {
     // Find which team in this hackathon the user belongs to
     const { data, error } = await this.db
       .from('hackathon_team_members')
       .select(`
          team:hackathon_teams!inner (
             *,
             members:hackathon_team_members(*, user:users(username, avatar))
          )
       `)
       .eq('user_id', userId)
       .eq('team.hackathon_id', hackathonId) // Filter by related table field
       .single();
    
    // Note: Supabase filtering on nested resource might require slightly different syntax or two queries if !inner is tricky. 
    // Let's try to fetch teams first then filter in memory if complex, but this query structure 'team!inner' is standard PostgREST.
    
    if (error && error.code !== 'PGRST116') return null; // PGRST116 is "The result contains 0 rows"
    return data?.team || null;
  }

  // --- Submissions ---

  async submitProject(userId: string, dto: SubmitProjectDto) {
    // Verify ownership
    const { data: project } = await this.db
      .from('projects')
      .select('author_id')
      .eq('id', dto.projectId)
      .single();

    if (!project || project.author_id !== userId) {
       throw new BadRequestException('Invalid project or unauthorized');
    }

    const { data, error } = await this.db
      .from('projects')
      .update({
        hackathon_id: dto.hackathonId,
        hackathon_track: dto.track
      })
      .eq('id', dto.projectId)
      .select()
      .single();

    if (error) throw new BadRequestException(error.message);
    return data;
  }
}
