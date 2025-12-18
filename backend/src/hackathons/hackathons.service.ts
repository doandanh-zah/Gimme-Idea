import {
    Injectable,
    NotFoundException,
    ForbiddenException,
    ConflictException,
    Logger,
} from "@nestjs/common";
import { SupabaseService } from "../shared/supabase.service";
import {
    CreateSubmissionDto,
    UpdateSubmissionDto,
    QuerySubmissionsDto,
    SubmissionStatus,
} from "./dto/submission.dto";

export interface HackathonSubmission {
    id: string;
    hackathonId: string;
    projectId: string;
    userId: string;
    pitchVideoUrl?: string;
    pitchDeckUrl?: string;
    notes?: string;
    status: SubmissionStatus;
    judgeScore?: number;
    judgeNotes?: string;
    submittedAt: string;
    updatedAt: string;
    voteCount?: number;
    hasVoted?: boolean;
    // Populated fields
    project?: {
        id: string;
        title: string;
        description: string;
        category: string;
        imageUrl?: string;
        votes: number;
    };
    author?: {
        id: string;
        username: string;
        avatar?: string;
    };
}

export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}

@Injectable()
export class HackathonsService {
    private readonly logger = new Logger(HackathonsService.name);

    constructor(private supabaseService: SupabaseService) { }

    /**
     * Helper: Resolve hackathon ID from slug or UUID
     * Returns null if not found (instead of throwing)
     */
    private async resolveHackathonId(idOrSlug: string): Promise<string | null> {
        // Check if it's a valid UUID format
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (uuidRegex.test(idOrSlug)) {
            return idOrSlug;
        }

        // It's a slug, look up the UUID
        const supabase = this.supabaseService.getAdminClient();
        const { data, error } = await supabase
            .from("hackathons")
            .select("id")
            .eq("slug", idOrSlug)
            .single();

        if (error || !data) {
            this.logger.warn(`Hackathon not found: ${idOrSlug}`);
            return null;
        }

        return data.id;
    }

    /**
     * Get all submissions for a hackathon
     */
    async getSubmissions(
        query: QuerySubmissionsDto,
        currentUserId?: string
    ): Promise<ApiResponse<HackathonSubmission[]>> {
        const supabase = this.supabaseService.getAdminClient();

        let supabaseQuery = supabase.from("hackathon_submissions").select(`
      id,
      hackathon_id,
      project_id,
      user_id,
      pitch_video_url,
      pitch_deck_url,
      notes,
      status,
      judge_score,
      submitted_at,
      updated_at,
      project:projects!hackathon_submissions_project_id_fkey(
        id,
        title,
        description,
        category,
        image_url,
        votes
      ),
      author:users!hackathon_submissions_user_id_fkey(
        id,
        username,
        avatar
      )
    `);

        // Apply filters
        if (query.hackathonId) {
            // Resolve hackathon ID from slug if needed
            const hackathonId = await this.resolveHackathonId(query.hackathonId);
            if (hackathonId) {
                supabaseQuery = supabaseQuery.eq("hackathon_id", hackathonId);
            } else {
                // Hackathon not in DB yet, return empty array
                return { success: true, data: [] };
            }
        }

        if (query.userId) {
            supabaseQuery = supabaseQuery.eq("user_id", query.userId);
        }

        if (query.status) {
            supabaseQuery = supabaseQuery.eq("status", query.status);
        }

        // Search in project title/description
        if (query.search) {
            // Need to do a join search - for now just search in notes
            supabaseQuery = supabaseQuery.ilike("notes", `%${query.search}%`);
        }

        // Apply sorting
        switch (query.sortBy) {
            case "votes":
                // Sort by project votes
                supabaseQuery = supabaseQuery.order("submitted_at", {
                    ascending: false,
                });
                break;
            case "score":
                supabaseQuery = supabaseQuery.order("judge_score", {
                    ascending: false,
                    nullsFirst: false,
                });
                break;
            case "newest":
            default:
                supabaseQuery = supabaseQuery.order("submitted_at", {
                    ascending: false,
                });
        }

        // Apply pagination
        const limit = query.limit || 20;
        const offset = query.offset || 0;
        supabaseQuery = supabaseQuery.range(offset, offset + limit - 1);

        const { data, error } = await supabaseQuery;

        if (error) {
            this.logger.error(`Failed to fetch submissions: ${error.message}`);
            throw new Error(`Failed to fetch submissions: ${error.message}`);
        }

        // Get vote counts for each submission
        const submissionIds = data.map((s) => s.id);
        const { data: voteCounts } = await supabase
            .from("hackathon_submission_votes")
            .select("submission_id")
            .in("submission_id", submissionIds);

        // Count votes per submission
        const voteCountMap = new Map<string, number>();
        voteCounts?.forEach((v) => {
            const count = voteCountMap.get(v.submission_id) || 0;
            voteCountMap.set(v.submission_id, count + 1);
        });

        // Check if current user has voted
        let userVotes = new Set<string>();
        if (currentUserId) {
            const { data: userVoteData } = await supabase
                .from("hackathon_submission_votes")
                .select("submission_id")
                .eq("user_id", currentUserId)
                .in("submission_id", submissionIds);

            userVotes = new Set(userVoteData?.map((v) => v.submission_id) || []);
        }

        // Map to response format
        const submissions: HackathonSubmission[] = data.map((s) => {
            const projectData = Array.isArray(s.project) ? s.project[0] : s.project;
            const authorData = Array.isArray(s.author) ? s.author[0] : s.author;

            return {
                id: s.id,
                hackathonId: s.hackathon_id,
                projectId: s.project_id,
                userId: s.user_id,
                pitchVideoUrl: s.pitch_video_url,
                pitchDeckUrl: s.pitch_deck_url,
                notes: s.notes,
                status: s.status,
                judgeScore: s.judge_score,
                submittedAt: s.submitted_at,
                updatedAt: s.updated_at,
                voteCount: voteCountMap.get(s.id) || 0,
                hasVoted: userVotes.has(s.id),
                project: projectData
                    ? {
                        id: projectData.id,
                        title: projectData.title,
                        description: projectData.description,
                        category: projectData.category,
                        imageUrl: projectData.image_url,
                        votes: projectData.votes,
                    }
                    : undefined,
                author: authorData
                    ? {
                        id: authorData.id,
                        username: authorData.username,
                        avatar: authorData.avatar,
                    }
                    : undefined,
            };
        });

        // Sort by votes if needed (after fetching vote counts)
        if (query.sortBy === "votes") {
            submissions.sort((a, b) => (b.voteCount || 0) - (a.voteCount || 0));
        }

        return {
            success: true,
            data: submissions,
        };
    }

    /**
     * Get single submission by ID
     */
    async getSubmissionById(
        id: string,
        currentUserId?: string
    ): Promise<ApiResponse<HackathonSubmission>> {
        const supabase = this.supabaseService.getAdminClient();

        const { data, error } = await supabase
            .from("hackathon_submissions")
            .select(
                `
        id,
        hackathon_id,
        project_id,
        user_id,
        pitch_video_url,
        pitch_deck_url,
        notes,
        status,
        judge_score,
        judge_notes,
        submitted_at,
        updated_at,
        project:projects!hackathon_submissions_project_id_fkey(
          id,
          title,
          description,
          category,
          image_url,
          votes
        ),
        author:users!hackathon_submissions_user_id_fkey(
          id,
          username,
          avatar
        )
      `
            )
            .eq("id", id)
            .single();

        if (error || !data) {
            throw new NotFoundException("Submission not found");
        }

        // Get vote count
        const { count: voteCount } = await supabase
            .from("hackathon_submission_votes")
            .select("*", { count: "exact", head: true })
            .eq("submission_id", id);

        // Check if user voted
        let hasVoted = false;
        if (currentUserId) {
            const { data: voteData } = await supabase
                .from("hackathon_submission_votes")
                .select("id")
                .eq("submission_id", id)
                .eq("user_id", currentUserId)
                .single();
            hasVoted = !!voteData;
        }

        const projectData = Array.isArray(data.project)
            ? data.project[0]
            : data.project;
        const authorData = Array.isArray(data.author)
            ? data.author[0]
            : data.author;

        return {
            success: true,
            data: {
                id: data.id,
                hackathonId: data.hackathon_id,
                projectId: data.project_id,
                userId: data.user_id,
                pitchVideoUrl: data.pitch_video_url,
                pitchDeckUrl: data.pitch_deck_url,
                notes: data.notes,
                status: data.status,
                judgeScore: data.judge_score,
                judgeNotes: data.judge_notes,
                submittedAt: data.submitted_at,
                updatedAt: data.updated_at,
                voteCount: voteCount || 0,
                hasVoted,
                project: projectData
                    ? {
                        id: projectData.id,
                        title: projectData.title,
                        description: projectData.description,
                        category: projectData.category,
                        imageUrl: projectData.image_url,
                        votes: projectData.votes,
                    }
                    : undefined,
                author: authorData
                    ? {
                        id: authorData.id,
                        username: authorData.username,
                        avatar: authorData.avatar,
                    }
                    : undefined,
            },
        };
    }

    /**
     * Create a new submission
     */
    async createSubmission(
        dto: CreateSubmissionDto,
        userId: string
    ): Promise<ApiResponse<HackathonSubmission>> {
        this.logger.log(`[createSubmission] Called with dto: ${JSON.stringify(dto)}, userId: ${userId}`);
        const supabase = this.supabaseService.getAdminClient();

        // Resolve hackathon ID from slug if needed
        this.logger.log(`[createSubmission] Resolving hackathon ID for: ${dto.hackathonId}`);
        const hackathonId = await this.resolveHackathonId(dto.hackathonId);
        if (!hackathonId) {
            throw new NotFoundException(`Hackathon not found: ${dto.hackathonId}`);
        }
        this.logger.log(`Creating submission for hackathon: ${hackathonId}`);

        // Check if submission already exists
        const { data: existing } = await supabase
            .from("hackathon_submissions")
            .select("id")
            .eq("hackathon_id", hackathonId)
            .eq("project_id", dto.projectId)
            .single();

        if (existing) {
            throw new ConflictException(
                "This project has already been submitted to this hackathon"
            );
        }

        // Verify user owns the project
        const { data: project } = await supabase
            .from("projects")
            .select("author_id")
            .eq("id", dto.projectId)
            .single();

        if (!project || project.author_id !== userId) {
            throw new ForbiddenException("You can only submit your own projects");
        }

        // Create submission
        const { data, error } = await supabase
            .from("hackathon_submissions")
            .insert({
                hackathon_id: hackathonId, // Use resolved UUID
                project_id: dto.projectId,
                user_id: userId,
                pitch_video_url: dto.pitchVideoUrl,
                pitch_deck_url: dto.pitchDeckUrl,
                notes: dto.notes,
                status: "submitted",
            })
            .select()
            .single();

        if (error) {
            this.logger.error(`Failed to create submission: ${error.message}`);
            throw new Error(`Failed to create submission: ${error.message}`);
        }

        return this.getSubmissionById(data.id, userId);
    }

    /**
     * Update a submission
     */
    async updateSubmission(
        id: string,
        dto: UpdateSubmissionDto,
        userId: string
    ): Promise<ApiResponse<HackathonSubmission>> {
        const supabase = this.supabaseService.getAdminClient();

        // Verify ownership
        const { data: existing } = await supabase
            .from("hackathon_submissions")
            .select("user_id, status")
            .eq("id", id)
            .single();

        if (!existing) {
            throw new NotFoundException("Submission not found");
        }

        if (existing.user_id !== userId) {
            throw new ForbiddenException("You can only edit your own submissions");
        }

        // Update submission
        const updateData: any = {};
        if (dto.pitchVideoUrl !== undefined)
            updateData.pitch_video_url = dto.pitchVideoUrl;
        if (dto.pitchDeckUrl !== undefined)
            updateData.pitch_deck_url = dto.pitchDeckUrl;
        if (dto.notes !== undefined) updateData.notes = dto.notes;

        // Auto-set status to submitted if video is provided and was draft
        if (dto.pitchVideoUrl && existing.status === "draft") {
            updateData.status = "submitted";
        }

        const { error } = await supabase
            .from("hackathon_submissions")
            .update(updateData)
            .eq("id", id);

        if (error) {
            this.logger.error(`Failed to update submission: ${error.message}`);
            throw new Error(`Failed to update submission: ${error.message}`);
        }

        return this.getSubmissionById(id, userId);
    }

    /**
     * Delete a submission
     */
    async deleteSubmission(
        id: string,
        userId: string
    ): Promise<ApiResponse<void>> {
        const supabase = this.supabaseService.getAdminClient();

        // Verify ownership
        const { data: existing } = await supabase
            .from("hackathon_submissions")
            .select("user_id")
            .eq("id", id)
            .single();

        if (!existing) {
            throw new NotFoundException("Submission not found");
        }

        if (existing.user_id !== userId) {
            throw new ForbiddenException("You can only delete your own submissions");
        }

        const { error } = await supabase
            .from("hackathon_submissions")
            .delete()
            .eq("id", id);

        if (error) {
            this.logger.error(`Failed to delete submission: ${error.message}`);
            throw new Error(`Failed to delete submission: ${error.message}`);
        }

        return {
            success: true,
            message: "Submission deleted successfully",
        };
    }

    /**
     * Vote for a submission
     */
    async voteSubmission(
        submissionId: string,
        userId: string
    ): Promise<ApiResponse<{ voteCount: number; hasVoted: boolean }>> {
        const supabase = this.supabaseService.getAdminClient();

        // Check if already voted
        const { data: existingVote } = await supabase
            .from("hackathon_submission_votes")
            .select("id")
            .eq("submission_id", submissionId)
            .eq("user_id", userId)
            .single();

        if (existingVote) {
            // Remove vote
            await supabase
                .from("hackathon_submission_votes")
                .delete()
                .eq("id", existingVote.id);
        } else {
            // Add vote
            await supabase.from("hackathon_submission_votes").insert({
                submission_id: submissionId,
                user_id: userId,
            });
        }

        // Get updated vote count
        const { count } = await supabase
            .from("hackathon_submission_votes")
            .select("*", { count: "exact", head: true })
            .eq("submission_id", submissionId);

        return {
            success: true,
            data: {
                voteCount: count || 0,
                hasVoted: !existingVote,
            },
        };
    }

    /**
     * Register for a hackathon
     */
    async registerForHackathon(
        hackathonId: string,
        userId: string,
        teamName?: string
    ): Promise<ApiResponse<void>> {
        const supabase = this.supabaseService.getAdminClient();

        const { error } = await supabase.from("hackathon_registrations").insert({
            hackathon_id: hackathonId,
            user_id: userId,
            team_name: teamName,
        });

        if (error) {
            if (error.code === "23505") {
                throw new ConflictException(
                    "You are already registered for this hackathon"
                );
            }
            throw new Error(`Failed to register: ${error.message}`);
        }

        return {
            success: true,
            message: "Successfully registered for hackathon",
        };
    }

    /**
     * Check if user is registered for a hackathon
     */
    async isRegistered(
        hackathonId: string,
        userId: string
    ): Promise<ApiResponse<boolean>> {
        const supabase = this.supabaseService.getAdminClient();

        const { data } = await supabase
            .from("hackathon_registrations")
            .select("id")
            .eq("hackathon_id", hackathonId)
            .eq("user_id", userId)
            .single();

        return {
            success: true,
            data: !!data,
        };
    }

    /**
     * Get hackathon stats
     */
    async getHackathonStats(
        hackathonId: string
    ): Promise<
        ApiResponse<{
            totalSubmissions: number;
            totalParticipants: number;
            categoryBreakdown: { category: string; count: number }[];
        }>
    > {
        const supabase = this.supabaseService.getAdminClient();

        // Get total submissions
        const { count: totalSubmissions } = await supabase
            .from("hackathon_submissions")
            .select("*", { count: "exact", head: true })
            .eq("hackathon_id", hackathonId);

        // Get total participants
        const { count: totalParticipants } = await supabase
            .from("hackathon_registrations")
            .select("*", { count: "exact", head: true })
            .eq("hackathon_id", hackathonId);

        // Get category breakdown
        const { data: submissions } = await supabase
            .from("hackathon_submissions")
            .select(
                `
        project:projects!hackathon_submissions_project_id_fkey(category)
      `
            )
            .eq("hackathon_id", hackathonId);

        const categoryCount = new Map<string, number>();
        submissions?.forEach((s) => {
            const project = Array.isArray(s.project) ? s.project[0] : s.project;
            if (project?.category) {
                const count = categoryCount.get(project.category) || 0;
                categoryCount.set(project.category, count + 1);
            }
        });

        const categoryBreakdown = Array.from(categoryCount.entries()).map(
            ([category, count]) => ({ category, count })
        );

        return {
            success: true,
            data: {
                totalSubmissions: totalSubmissions || 0,
                totalParticipants: totalParticipants || 0,
                categoryBreakdown,
            },
        };
    }
}
