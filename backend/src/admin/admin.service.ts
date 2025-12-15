import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
} from "@nestjs/common";
import { SupabaseService } from "../shared/supabase.service";
import { ApiResponse } from "../shared/types";

// Gimme Sensei wallet for verification
const ADMIN_BOT_WALLET = "FzcnaZMYcoAYpLgr7Wym2b8hrKYk3VXsRxWSLuvZKLJm";

export interface Hackathon {
  id: string;
  slug: string;
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  prizePool?: string;
  status: "upcoming" | "active" | "voting" | "completed";
  imageUrl?: string;
  tags: string[];
  participantsCount: number;
  createdAt: string;
  createdBy?: string;
}

export interface HackathonSubmission {
  id: string;
  hackathonId: string;
  projectId: string;
  userId: string;
  score?: number;
  scoreBreakdown?: {
    innovation: number;
    execution: number;
    impact: number;
    presentation: number;
  };
  scoredBy?: string;
  scoredAt?: string;
  adminNotes?: string;
  status: "pending" | "approved" | "rejected" | "winner" | "finalist";
  submittedAt: string;
  project?: any;
  user?: any;
}

export interface CreateHackathonDto {
  slug: string;
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  prizePool?: string;
  imageUrl?: string;
  tags?: string[];
}

export interface ScoreSubmissionDto {
  score: number; // 0-100
  scoreBreakdown?: {
    innovation: number;
    execution: number;
    impact: number;
    presentation: number;
  };
  adminNotes?: string;
  status?: "approved" | "rejected" | "winner" | "finalist";
}

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(private supabaseService: SupabaseService) {}

  /**
   * Check if user is admin
   */
  async isAdmin(userId: string): Promise<boolean> {
    const supabase = this.supabaseService.getAdminClient();

    const { data: user, error } = await supabase
      .from("users")
      .select("role, wallet")
      .eq("id", userId)
      .single();

    if (error || !user) {
      return false;
    }

    // Admin by role or by being Gimme Sensei
    return user.role === "admin" || user.wallet === ADMIN_BOT_WALLET;
  }

  /**
   * Get user's admin role
   */
  async getUserRole(
    userId: string
  ): Promise<{ role: string; isAdmin: boolean }> {
    const supabase = this.supabaseService.getAdminClient();

    const { data: user } = await supabase
      .from("users")
      .select("role, wallet")
      .eq("id", userId)
      .single();

    if (!user) {
      return { role: "user", isAdmin: false };
    }

    const isAdmin = user.role === "admin" || user.wallet === ADMIN_BOT_WALLET;

    return {
      role: user.role || "user",
      isAdmin,
    };
  }

  /**
   * Admin delete any project
   */
  async adminDeleteProject(
    adminId: string,
    projectId: string
  ): Promise<ApiResponse<void>> {
    const isAdmin = await this.isAdmin(adminId);
    if (!isAdmin) {
      throw new ForbiddenException("Admin access required");
    }

    const supabase = this.supabaseService.getAdminClient();

    // Get project info for logging
    const { data: project } = await supabase
      .from("projects")
      .select("title, author_id")
      .eq("id", projectId)
      .single();

    if (!project) {
      throw new NotFoundException("Project not found");
    }

    // Delete project
    const { error } = await supabase
      .from("projects")
      .delete()
      .eq("id", projectId);

    if (error) {
      throw new Error(`Failed to delete project: ${error.message}`);
    }

    // Log admin action
    await this.logAdminAction(adminId, "delete_project", "project", projectId, {
      projectTitle: project.title,
      originalAuthor: project.author_id,
    });

    this.logger.log(`Admin ${adminId} deleted project ${projectId}`);

    return {
      success: true,
      message: "Project deleted by admin",
    };
  }

  /**
   * Admin verify/unverify a project
   */
  async verifyProject(
    adminId: string,
    projectId: string,
    verified: boolean
  ): Promise<ApiResponse<void>> {
    const isAdmin = await this.isAdmin(adminId);
    if (!isAdmin) {
      throw new ForbiddenException("Admin access required");
    }

    const supabase = this.supabaseService.getAdminClient();

    const { error } = await supabase
      .from("projects")
      .update({
        is_verified: verified,
        verified_by: verified ? adminId : null,
        verified_at: verified ? new Date().toISOString() : null,
      })
      .eq("id", projectId);

    if (error) {
      throw new Error(`Failed to verify project: ${error.message}`);
    }

    await this.logAdminAction(
      adminId,
      verified ? "verify_project" : "unverify_project",
      "project",
      projectId,
      {}
    );

    return {
      success: true,
      message: verified ? "Project verified" : "Project unverified",
    };
  }

  // ============================================
  // HACKATHON MANAGEMENT
  // ============================================

  /**
   * Create a new hackathon (admin only)
   */
  async createHackathon(
    adminId: string,
    dto: CreateHackathonDto
  ): Promise<ApiResponse<Hackathon>> {
    const isAdmin = await this.isAdmin(adminId);
    if (!isAdmin) {
      throw new ForbiddenException("Admin access required");
    }

    const supabase = this.supabaseService.getAdminClient();

    const { data: hackathon, error } = await supabase
      .from("hackathons")
      .insert({
        slug: dto.slug,
        title: dto.title,
        description: dto.description,
        start_date: dto.startDate,
        end_date: dto.endDate,
        prize_pool: dto.prizePool,
        image_url: dto.imageUrl,
        tags: dto.tags || [],
        status: "upcoming",
        created_by: adminId,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create hackathon: ${error.message}`);
    }

    await this.logAdminAction(
      adminId,
      "create_hackathon",
      "hackathon",
      hackathon.id,
      { title: dto.title }
    );

    return {
      success: true,
      data: this.mapHackathon(hackathon),
      message: "Hackathon created successfully",
    };
  }

  /**
   * Update hackathon
   */
  async updateHackathon(
    adminId: string,
    hackathonId: string,
    updates: Partial<CreateHackathonDto> & { status?: string }
  ): Promise<ApiResponse<Hackathon>> {
    const isAdmin = await this.isAdmin(adminId);
    if (!isAdmin) {
      throw new ForbiddenException("Admin access required");
    }

    const supabase = this.supabaseService.getAdminClient();

    const updateData: any = {};
    if (updates.title) updateData.title = updates.title;
    if (updates.description) updateData.description = updates.description;
    if (updates.startDate) updateData.start_date = updates.startDate;
    if (updates.endDate) updateData.end_date = updates.endDate;
    if (updates.prizePool) updateData.prize_pool = updates.prizePool;
    if (updates.imageUrl) updateData.image_url = updates.imageUrl;
    if (updates.tags) updateData.tags = updates.tags;
    if (updates.status) updateData.status = updates.status;

    const { data: hackathon, error } = await supabase
      .from("hackathons")
      .update(updateData)
      .eq("id", hackathonId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update hackathon: ${error.message}`);
    }

    await this.logAdminAction(
      adminId,
      "update_hackathon",
      "hackathon",
      hackathonId,
      { updates }
    );

    return {
      success: true,
      data: this.mapHackathon(hackathon),
      message: "Hackathon updated successfully",
    };
  }

  /**
   * Delete hackathon
   */
  async deleteHackathon(
    adminId: string,
    hackathonId: string
  ): Promise<ApiResponse<void>> {
    const isAdmin = await this.isAdmin(adminId);
    if (!isAdmin) {
      throw new ForbiddenException("Admin access required");
    }

    const supabase = this.supabaseService.getAdminClient();

    // Get hackathon info for logging
    const { data: hackathon } = await supabase
      .from("hackathons")
      .select("title")
      .eq("id", hackathonId)
      .single();

    const { error } = await supabase
      .from("hackathons")
      .delete()
      .eq("id", hackathonId);

    if (error) {
      throw new Error(`Failed to delete hackathon: ${error.message}`);
    }

    await this.logAdminAction(
      adminId,
      "delete_hackathon",
      "hackathon",
      hackathonId,
      { title: hackathon?.title }
    );

    return {
      success: true,
      message: "Hackathon deleted successfully",
    };
  }

  /**
   * Get all hackathons (with more details for admin)
   */
  async getAllHackathons(): Promise<ApiResponse<Hackathon[]>> {
    const supabase = this.supabaseService.getAdminClient();

    const { data: hackathons, error } = await supabase
      .from("hackathons")
      .select("*")
      .order("start_date", { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch hackathons: ${error.message}`);
    }

    return {
      success: true,
      data: hackathons.map(this.mapHackathon),
    };
  }

  // ============================================
  // SUBMISSION SCORING
  // ============================================

  /**
   * Score a hackathon submission
   */
  async scoreSubmission(
    adminId: string,
    submissionId: string,
    scoreDto: ScoreSubmissionDto
  ): Promise<ApiResponse<HackathonSubmission>> {
    const isAdmin = await this.isAdmin(adminId);
    if (!isAdmin) {
      throw new ForbiddenException("Admin access required");
    }

    if (scoreDto.score < 0 || scoreDto.score > 100) {
      throw new Error("Score must be between 0 and 100");
    }

    const supabase = this.supabaseService.getAdminClient();

    const { data: submission, error } = await supabase
      .from("hackathon_submissions")
      .update({
        score: scoreDto.score,
        score_breakdown: scoreDto.scoreBreakdown,
        admin_notes: scoreDto.adminNotes,
        status: scoreDto.status || "approved",
        scored_by: adminId,
        scored_at: new Date().toISOString(),
      })
      .eq("id", submissionId)
      .select(
        `
        *,
        project:projects(*),
        user:users(username, avatar, wallet)
      `
      )
      .single();

    if (error) {
      throw new Error(`Failed to score submission: ${error.message}`);
    }

    await this.logAdminAction(
      adminId,
      "score_submission",
      "submission",
      submissionId,
      {
        score: scoreDto.score,
        status: scoreDto.status,
      }
    );

    return {
      success: true,
      data: this.mapSubmission(submission),
      message: "Submission scored successfully",
    };
  }

  /**
   * Get submissions for a hackathon (for admin to score)
   */
  async getHackathonSubmissions(
    hackathonId: string
  ): Promise<ApiResponse<HackathonSubmission[]>> {
    const supabase = this.supabaseService.getAdminClient();

    const { data: submissions, error } = await supabase
      .from("hackathon_submissions")
      .select(
        `
        *,
        project:projects(id, title, description, category, image_url, votes, ai_score),
        user:users(id, username, avatar, wallet)
      `
      )
      .eq("hackathon_id", hackathonId)
      .order("score", { ascending: false, nullsFirst: false });

    if (error) {
      throw new Error(`Failed to fetch submissions: ${error.message}`);
    }

    return {
      success: true,
      data: submissions.map(this.mapSubmission),
    };
  }

  /**
   * Update submission status (winner, finalist, rejected)
   */
  async updateSubmissionStatus(
    adminId: string,
    submissionId: string,
    status: "pending" | "approved" | "rejected" | "winner" | "finalist"
  ): Promise<ApiResponse<void>> {
    const isAdmin = await this.isAdmin(adminId);
    if (!isAdmin) {
      throw new ForbiddenException("Admin access required");
    }

    const supabase = this.supabaseService.getAdminClient();

    const { error } = await supabase
      .from("hackathon_submissions")
      .update({ status })
      .eq("id", submissionId);

    if (error) {
      throw new Error(`Failed to update status: ${error.message}`);
    }

    await this.logAdminAction(
      adminId,
      "update_submission_status",
      "submission",
      submissionId,
      { status }
    );

    return {
      success: true,
      message: `Submission marked as ${status}`,
    };
  }

  // ============================================
  // ADMIN ACTIVITY LOG
  // ============================================

  /**
   * Get admin activity log
   */
  async getAdminActivityLog(
    adminId: string,
    limit: number = 50
  ): Promise<ApiResponse<any[]>> {
    const isAdmin = await this.isAdmin(adminId);
    if (!isAdmin) {
      throw new ForbiddenException("Admin access required");
    }

    const supabase = this.supabaseService.getAdminClient();

    const { data: logs, error } = await supabase
      .from("admin_activity_log")
      .select(
        `
        *,
        admin:users!admin_activity_log_admin_id_fkey(username, avatar)
      `
      )
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`Failed to fetch activity log: ${error.message}`);
    }

    return {
      success: true,
      data: logs,
    };
  }

  // ============================================
  // PRIVATE HELPERS
  // ============================================

  private async logAdminAction(
    adminId: string,
    action: string,
    targetType: string,
    targetId: string,
    details: any
  ): Promise<void> {
    const supabase = this.supabaseService.getAdminClient();

    await supabase.from("admin_activity_log").insert({
      admin_id: adminId,
      action,
      target_type: targetType,
      target_id: targetId,
      details,
    });
  }

  private mapHackathon(h: any): Hackathon {
    return {
      id: h.id,
      slug: h.slug,
      title: h.title,
      description: h.description,
      startDate: h.start_date,
      endDate: h.end_date,
      prizePool: h.prize_pool,
      status: h.status,
      imageUrl: h.image_url,
      tags: h.tags || [],
      participantsCount: h.participants_count || 0,
      createdAt: h.created_at,
      createdBy: h.created_by,
    };
  }

  private mapSubmission(s: any): HackathonSubmission {
    return {
      id: s.id,
      hackathonId: s.hackathon_id,
      projectId: s.project_id,
      userId: s.user_id,
      score: s.score,
      scoreBreakdown: s.score_breakdown,
      scoredBy: s.scored_by,
      scoredAt: s.scored_at,
      adminNotes: s.admin_notes,
      status: s.status,
      submittedAt: s.submitted_at,
      project: s.project,
      user: s.user,
    };
  }
}
