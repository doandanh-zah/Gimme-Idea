import { Injectable, Logger } from "@nestjs/common";
import OpenAI from "openai";
import { SupabaseService } from "../shared/supabase.service";

// AI Bot Account Configuration - Uses environment variables for flexibility
const AI_BOT_CONFIG = {
  username: process.env.AI_BOT_USERNAME || "Gimme Sensei",
  wallet:
    process.env.AI_BOT_WALLET || "FzcnaZMYcoAYpLgr7Wym2b8hrKYk3VXsRxWSLuvZKLJm",
  email: process.env.AI_BOT_EMAIL || "gimmeidea.contact@gmail.com",
  avatar:
    process.env.AI_BOT_AVATAR ||
    "https://api.dicebear.com/7.x/bottts/svg?seed=gimme-sensei&backgroundColor=6366f1",
  bio: process.env.AI_BOT_BIO || "AI-powered startup advisor & mentor",
};

export interface IdeaFeedbackRequest {
  title: string;
  problem: string;
  solution: string;
  opportunity?: string;
}

export interface AIFeedback {
  comment: string;
  score: number; // 0-100
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
}

export interface MarketAssessment {
  score: number; // 0-100
  assessmentText: string;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  marketSize: "small" | "medium" | "large";
  competitionLevel: "low" | "medium" | "high";
}

@Injectable()
export class AIService {
  private readonly logger = new Logger(AIService.name);
  private openai: OpenAI;

  constructor(private supabaseService: SupabaseService) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      this.logger.warn("OPENAI_API_KEY not found in environment variables");
    }
    this.openai = new OpenAI({
      apiKey: apiKey || "sk-dummy-key", // Fallback for development
    });
  }

  /**
   * Generate AI feedback for an idea
   */
  async generateIdeaFeedback(idea: IdeaFeedbackRequest): Promise<AIFeedback> {
    this.logger.log(`Generating AI feedback for idea: ${idea.title}`);

    const prompt = `You are "Gimme Sensei" - a brutally honest Web3/crypto startup advisor.

**IDEA:**
- Title: ${idea.title}
- Problem: ${idea.problem}
- Solution: ${idea.solution}
- Opportunity: ${idea.opportunity || "Not specified"}

**QUICK EVALUATION (Score 0-100):**
Consider: Problem validity, blockchain necessity, technical feasibility, competition, user adoption, tokenomics, go-to-market, revenue model, risks.

**SCORING:**
- 0-39: Fundamentally flawed
- 40-54: Weak, needs rethinking
- 55-69: Has potential but gaps
- 70-79: Solid, worth prototyping
- 80-89: Strong, investable
- 90-100: Exceptional

**RESPONSE RULES:**
- Keep comment to 2-4 SHORT paragraphs max (150-250 words total)
- Write like talking to founder face-to-face - direct, concise
- NO bullet points, NO emojis, NO headers in comment
- Be SPECIFIC to this idea - no generic advice
- Focus on 1-2 key strengths and 1-2 main concerns
- End with ONE clear actionable next step

**FORMAT:** Return valid JSON:
{
  "score": <0-100>,
  "comment": "<2-4 short paragraphs, conversational, 150-250 words max>",
  "strengths": ["<key strength 1>", "<key strength 2>"],
  "weaknesses": ["<main weakness 1>", "<main weakness 2>"],
  "suggestions": ["<top priority action>", "<secondary action>"]
}`;

    try {
      const completion = await this.openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "You are Gimme Sensei, a brutally honest Web3 advisor. Keep feedback CONCISE - 2-4 short paragraphs, 150-250 words max. No fluff, no generic advice. Score rigorously - most ideas land between 40-65. Always respond in English only.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.8,
        max_tokens: 800,
        response_format: { type: "json_object" },
      });

      const response = completion.choices[0].message.content;
      const feedback = JSON.parse(response);

      this.logger.log(
        `AI feedback generated successfully with score: ${feedback.score}`
      );

      return {
        comment: feedback.comment,
        score: feedback.score,
        strengths: feedback.strengths || [],
        weaknesses: feedback.weaknesses || [],
        suggestions: feedback.suggestions || [],
      };
    } catch (error) {
      this.logger.error("Failed to generate AI feedback:", error);
      throw new Error("Failed to generate AI feedback");
    }
  }

  /**
   * Generate AI reply to user comment - strict, realistic, market-focused
   */
  async generateReplyToUser(
    userMessage: string,
    ideaContext: IdeaFeedbackRequest,
    previousAIComment?: string,
    conversationHistory?: Array<{ role: string; content: string }>
  ): Promise<string> {
    this.logger.log("Generating AI reply to user message");

    const contextPrompt = `You are Gimme Sensei - a seasoned startup mentor who's helped build and break hundreds of Web3 projects. You talk like a real person, not a chatbot.

**IDEA CONTEXT:**
- Title: ${ideaContext.title}
- Problem: ${ideaContext.problem}
- Solution: ${ideaContext.solution}
${ideaContext.opportunity ? `- Opportunity: ${ideaContext.opportunity}` : ""}

${previousAIComment ? `**YOUR PREVIOUS FEEDBACK:**\n${previousAIComment}\n` : ""
      }

**HOW TO RESPOND:**
- Talk naturally like you're chatting with the founder, not writing a report
- Keep it SHORT - 2-4 sentences max
- No bullet points, no emojis, no numbered lists
- Be direct and honest but not harsh
- If they ask something specific, answer it specifically
- If their question is vague, ask what exactly they mean
- Reference real examples or competitors when relevant
- Never start with "Great question!" or similar filler

**LANGUAGE:** Always respond in English only, even if the user writes in another language.`;

    const messages = [
      {
        role: "system",
        content: contextPrompt,
      },
      ...(conversationHistory || []),
      {
        role: "user",
        content: userMessage,
      },
    ];

    try {
      const completion = await this.openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: messages as any,
        temperature: 0.7,
        max_tokens: 400,
      });

      const reply = completion.choices[0].message.content;
      this.logger.log("AI reply generated successfully");

      return reply;
    } catch (error) {
      this.logger.error("Failed to generate AI reply:", error);
      throw new Error("Failed to generate AI reply");
    }
  }

  /**
   * Generate market assessment for an idea
   */
  async generateMarketAssessment(
    idea: IdeaFeedbackRequest
  ): Promise<MarketAssessment> {
    this.logger.log(`Generating market assessment for: ${idea.title}`);

    const prompt = `You are a market analyst. Assess the market potential of this business idea.

**Idea:** ${idea.title}
**Problem:** ${idea.problem}
**Solution:** ${idea.solution}
**Opportunity:** ${idea.opportunity || "Not specified"}

Analyze:
1. Market size potential (small/medium/large)
2. Competition level (low/medium/high)
3. Overall market viability score (0-100)
4. Key market strengths
5. Key market risks
6. Recommendations for market entry

Respond with valid JSON:
{
  "score": <number 0-100>,
  "marketSize": "small" | "medium" | "large",
  "competitionLevel": "low" | "medium" | "high",
  "assessmentText": "Brief 2-3 sentence summary",
  "strengths": ["strength1", "strength2"],
  "weaknesses": ["risk1", "risk2"],
  "recommendations": ["rec1", "rec2"]
}`;

    try {
      const completion = await this.openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are a market analyst. Respond with valid JSON only.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.6,
        max_tokens: 800,
        response_format: { type: "json_object" },
      });

      const response = completion.choices[0].message.content;
      const assessment = JSON.parse(response);

      this.logger.log(
        `Market assessment generated with score: ${assessment.score}`
      );

      return {
        score: assessment.score,
        assessmentText: assessment.assessmentText,
        strengths: assessment.strengths || [],
        weaknesses: assessment.weaknesses || [],
        recommendations: assessment.recommendations || [],
        marketSize: assessment.marketSize,
        competitionLevel: assessment.competitionLevel,
      };
    } catch (error) {
      this.logger.error("Failed to generate market assessment:", error);
      throw new Error("Failed to generate market assessment");
    }
  }

  /**
   * Check if user can use AI features (has credits)
   */
  async checkUserAIQuota(
    userId: string,
    projectId: string
  ): Promise<{
    canUse: boolean;
    freeRemaining: number;
    paidCredits: number;
    interactionsUsed: number;
    maxFreeInteractions: number;
  }> {
    const supabase = this.supabaseService.getAdminClient();

    try {
      const { data, error } = await supabase.rpc("can_user_use_ai", {
        p_user_id: userId,
        p_project_id: projectId,
      });

      this.logger.log(
        `[AI Quota Check] userId: ${userId}, projectId: ${projectId}`
      );
      this.logger.log(
        `[AI Quota Check] Raw data from RPC: ${JSON.stringify(data)}`
      );

      if (error) {
        this.logger.error(
          `[AI Quota Check] RPC error: ${JSON.stringify(error)}`
        );
        throw error;
      }

      // Handle both camelCase and lowercase keys from PostgreSQL
      const result = {
        canUse: data?.canUse ?? data?.canuse ?? false,
        freeRemaining: data?.freeRemaining ?? data?.freeremaining ?? 0,
        paidCredits: data?.paidCredits ?? data?.paidcredits ?? 0,
        interactionsUsed: data?.interactionsUsed ?? data?.interactionsused ?? 0,
        maxFreeInteractions:
          data?.maxFreeInteractions ?? data?.maxfreeinteractions ?? 10,
      };

      this.logger.log(
        `[AI Quota Check] Processed result: ${JSON.stringify(result)}`
      );

      return result;
    } catch (error) {
      this.logger.error("Failed to check AI quota:", error);
      throw new Error("Failed to check AI quota");
    }
  }

  /**
   * Track AI interaction usage
   */
  async trackAIInteraction(
    userId: string,
    projectId: string,
    interactionType: "feedback" | "reply" | "auto_reply",
    commentId?: string,
    tokensUsed: number = 0
  ): Promise<boolean> {
    const supabase = this.supabaseService.getAdminClient();

    try {
      const { data, error } = await supabase.rpc("track_ai_interaction", {
        p_user_id: userId,
        p_project_id: projectId,
        p_interaction_type: interactionType,
        p_comment_id: commentId,
        p_tokens_used: tokensUsed,
      });

      if (error) throw error;

      this.logger.log(
        `AI interaction tracked: ${interactionType} for user ${userId} on project ${projectId}`
      );

      return data;
    } catch (error) {
      this.logger.error("Failed to track AI interaction:", error);
      throw new Error("Failed to track AI interaction");
    }
  }

  /**
   * Find matching ideas based on user interest and strengths
   */
  async findMatchingIdeas(
    interest: string,
    strengths: string
  ): Promise<{ ideas: any[]; reasoning: string }> {
    this.logger.log(`Finding matching ideas for interest: ${interest}`);

    const supabase = this.supabaseService.getAdminClient();

    try {
      // Fetch top ideas from database
      const { data: ideas, error } = await supabase
        .from("projects")
        .select(
          `
          *,
          author:users!projects_author_id_fkey(
            username,
            wallet,
            avatar
          )
        `
        )
        .eq("type", "idea")
        .order("ai_score", { ascending: false, nullsFirst: false })
        .limit(20);

      if (error) throw error;

      // Use AI to analyze and rank ideas based on user context
      const prompt = `You're helping someone find ideas that match their skills and interests.

Their interest: ${interest}
Their strengths: ${strengths}

Here are the available ideas:
${ideas
          .map(
            (idea, idx) => `
${idx + 1}. ${idea.title} (${idea.category})
   Problem: ${idea.problem}
   Solution: ${idea.solution}
   Votes: ${idea.votes || 0}
`
          )
          .join("\n")}

Pick the 3 best matches for this person. Think about what would actually be a good fit for their skills and what they want to work on.

Return valid JSON:
{
  "topIdeas": [<index1>, <index2>, <index3>],
  "reasoning": "Explain why these are good matches in a natural, conversational way (3-4 sentences). Don't use a template or formulaic language - just talk naturally about why you think these ideas would work well for them."
}`;

      const completion = await this.openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "You help people find ideas that match their skills. Be conversational and natural - avoid rigid templates or formal language. Respond with valid JSON only.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 500,
        response_format: { type: "json_object" },
      });

      const response = JSON.parse(completion.choices[0].message.content);
      const topIdeas = response.topIdeas
        .map((idx: number) => ideas[idx - 1])
        .filter(Boolean);

      // Format ideas for frontend
      const formattedIdeas = topIdeas.map((idea: any) => ({
        id: idea.id,
        title: idea.title,
        problem: idea.problem,
        solution: idea.solution,
        category: idea.category,
        votes: idea.votes || 0,
        feedbackCount: idea.feedback_count || 0,
        tags: idea.tags || [],
        author: idea.is_anonymous
          ? null
          : {
            username: idea.author?.username,
            wallet: idea.author?.wallet,
            avatar: idea.author?.avatar,
          },
        isAnonymous: idea.is_anonymous,
      }));

      return {
        ideas: formattedIdeas,
        reasoning: response.reasoning,
      };
    } catch (error) {
      this.logger.error("Failed to find matching ideas:", error);
      throw new Error("Failed to find matching ideas");
    }
  }

  /**
   * Continue conversation with AI
   */
  async continueConversation(
    message: string,
    context: { interest: string; strengths: string },
    history: Array<{ role: string; content: string }>
  ): Promise<string> {
    this.logger.log("Continuing AI conversation");

    const systemPrompt = `You are Gimme Sensei, a friendly and knowledgeable Web3 startup advisor. You're having a natural conversation with someone who is exploring startup ideas.

Context about this person:
- Their interest area: ${context.interest || "Not specified yet"}
- Their background/strengths: ${context.strengths || "Not specified yet"}

Guidelines:
- Be conversational and natural - like chatting with a friend who happens to be a startup expert
- Actually RESPOND to what they're saying - don't give generic advice
- If they ask a question, answer it directly
- If they share something, engage with it meaningfully
- Vary your response style - don't start every message the same way
- Keep responses concise (2-4 sentences max) unless they ask for detailed explanation
- If they want to explore a different idea or topic, go with it
- Be encouraging but honest - don't just say what they want to hear
- You can ask clarifying questions if needed
- Use casual language, occasional humor is fine
- NO bullet points, NO numbered lists, NO formal structure - just natural conversation`;

    // Filter and format history properly
    const validHistory = (history || [])
      .filter((msg) => msg && msg.role && msg.content)
      .map((msg) => ({
        role:
          msg.role === "assistant" || msg.role === "ai"
            ? ("assistant" as const)
            : ("user" as const),
        content: msg.content,
      }));

    const messages: Array<{
      role: "system" | "user" | "assistant";
      content: string;
    }> = [
        {
          role: "system",
          content: systemPrompt,
        },
        ...validHistory,
        {
          role: "user",
          content: message,
        },
      ];

    try {
      const completion = await this.openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: messages,
        temperature: 0.8, // Higher temperature for more varied responses
        max_tokens: 300,
        presence_penalty: 0.6, // Encourage diverse vocabulary
        frequency_penalty: 0.4, // Reduce repetition
      });

      const reply = completion.choices[0].message.content;
      this.logger.log("AI conversation continued successfully");

      return reply;
    } catch (error) {
      this.logger.error("Failed to continue conversation:", error);
      throw new Error("Failed to continue conversation");
    }
  }

  /**
   * Check if user message warrants an AI reply
   * Only reply to questions, challenges, criticisms, or requests for clarification
   * Skip: thank you, compliments, meaningless messages, simple agreements
   */
  async shouldAIReply(
    userMessage: string
  ): Promise<{ shouldReply: boolean; reason: string }> {
    this.logger.log("Checking if AI should reply to user message");

    const prompt = `Analyze this user message and determine if it warrants an AI reply.

USER MESSAGE: "${userMessage}"

SHOULD REPLY if the message is:
- A question (asking for info, clarification, advice)
- A challenge or disagreement (questioning the AI's feedback)
- Criticism or pushback (user defending their idea)
- A request for more details or specifics
- A meaningful continuation of the discussion

SHOULD NOT REPLY if the message is:
- A thank you or expression of gratitude ("thanks", "thank you", "cảm ơn", "tks")
- A compliment or praise ("great advice", "helpful", "hay quá", "good point")
- A simple agreement ("ok", "yes", "agree", "đúng rồi", "I see")
- Meaningless or empty message (".", "...", "hmm", "lol", emoji only)
- A goodbye or closing statement ("bye", "see you", "tạm biệt")

Respond with JSON only:
{
  "shouldReply": true/false,
  "reason": "brief explanation"
}`;

    try {
      const completion = await this.openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You analyze user intent. Respond with valid JSON only.",
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.3,
        max_tokens: 100,
        response_format: { type: "json_object" },
      });

      const response = JSON.parse(completion.choices[0].message.content);
      this.logger.log(
        `shouldAIReply result: ${response.shouldReply} - ${response.reason}`
      );

      return {
        shouldReply: response.shouldReply,
        reason: response.reason,
      };
    } catch (error) {
      this.logger.error("Failed to check if should reply:", error);
      // Default to not replying on error to avoid unwanted responses
      return { shouldReply: false, reason: "Error analyzing message" };
    }
  }

  /**
   * Create AI reply comment in database
   * Called when user replies to an AI-generated comment
   * Only replies if user asks a question or challenges/criticizes
   */
  async createAIReplyComment(
    projectId: string,
    parentCommentId: string,
    userQuestion: string,
    ideaContext: IdeaFeedbackRequest,
    previousAIComment: string
  ): Promise<{
    success: boolean;
    comment?: any;
    error?: string;
    skipped?: boolean;
    skipReason?: string;
  }> {
    this.logger.log(`Creating AI reply for comment ${parentCommentId}`);

    const supabase = this.supabaseService.getAdminClient();

    try {
      // First, check if user message warrants a reply
      const { shouldReply, reason } = await this.shouldAIReply(userQuestion);

      if (!shouldReply) {
        this.logger.log(`Skipping AI reply: ${reason}`);
        return {
          success: true,
          skipped: true,
          skipReason: reason,
        };
      }

      // Generate AI reply
      const aiReply = await this.generateReplyToUser(
        userQuestion,
        ideaContext,
        previousAIComment
      );

      // Get or create AI bot user - find by wallet (most reliable)
      const { data: aiUser, error: userError } = await supabase
        .from("users")
        .select("id")
        .eq("wallet", AI_BOT_CONFIG.wallet)
        .single();

      if (userError || !aiUser) {
        // Try to find by username as fallback
        const { data: aiUserByName } = await supabase
          .from("users")
          .select("id")
          .eq("username", AI_BOT_CONFIG.username)
          .single();

        if (aiUserByName) {
          // Use existing user found by username
          const { data: comment, error: commentError } = await supabase
            .from("comments")
            .insert({
              project_id: projectId,
              user_id: aiUserByName.id,
              parent_comment_id: parentCommentId,
              content: aiReply,
              is_anonymous: false,
              likes: 0,
              tips_amount: 0,
              is_ai_generated: true,
              ai_model: "gpt-4o-mini",
              ai_tokens_used: 0,
              created_at: new Date().toISOString(),
            })
            .select(
              `*, author:users!comments_user_id_fkey(username, wallet, avatar)`
            )
            .single();

          if (commentError) {
            this.logger.error(
              "Failed to create AI reply comment",
              commentError
            );
            return { success: false, error: "Failed to create AI reply" };
          }

          await supabase.rpc("increment_feedback_count", {
            project_id: projectId,
          });
          return { success: true, comment };
        }

        // Create AI user if doesn't exist
        const { data: newAiUser, error: createError } = await supabase
          .from("users")
          .insert({
            username: AI_BOT_CONFIG.username,
            wallet: AI_BOT_CONFIG.wallet,
            avatar: AI_BOT_CONFIG.avatar,
            reputation_score: 1000,
            balance: 0,
            bio: AI_BOT_CONFIG.bio,
          })
          .select("id")
          .single();

        if (createError) {
          this.logger.error("Failed to create AI bot user", createError);
          return { success: false, error: "Failed to create AI user" };
        }

        // Create AI reply comment
        const { data: comment, error: commentError } = await supabase
          .from("comments")
          .insert({
            project_id: projectId,
            user_id: newAiUser.id,
            parent_comment_id: parentCommentId,
            content: aiReply,
            is_anonymous: false,
            likes: 0,
            tips_amount: 0,
            is_ai_generated: true,
            ai_model: "gpt-4o-mini",
            ai_tokens_used: 0,
            created_at: new Date().toISOString(),
          })
          .select(
            `
            *,
            author:users!comments_user_id_fkey(username, wallet, avatar)
          `
          )
          .single();

        if (commentError) {
          this.logger.error("Failed to create AI reply comment", commentError);
          return { success: false, error: "Failed to create AI reply" };
        }

        // Increment feedback count
        await supabase.rpc("increment_feedback_count", {
          project_id: projectId,
        });

        return { success: true, comment };
      }

      // Create AI reply comment with existing AI user
      const { data: comment, error: commentError } = await supabase
        .from("comments")
        .insert({
          project_id: projectId,
          user_id: aiUser.id,
          parent_comment_id: parentCommentId,
          content: aiReply,
          is_anonymous: false,
          likes: 0,
          tips_amount: 0,
          is_ai_generated: true,
          ai_model: "gpt-4o-mini",
          ai_tokens_used: 0,
          created_at: new Date().toISOString(),
        })
        .select(
          `
          *,
          author:users!comments_user_id_fkey(username, wallet, avatar)
        `
        )
        .single();

      if (commentError) {
        this.logger.error("Failed to create AI reply comment", commentError);
        return { success: false, error: "Failed to create AI reply" };
      }

      // Increment feedback count
      await supabase.rpc("increment_feedback_count", { project_id: projectId });

      this.logger.log(`AI reply created for comment ${parentCommentId}`);

      return {
        success: true,
        comment: {
          id: comment.id,
          projectId: comment.project_id,
          content: comment.content,
          author: {
            username: comment.author.username,
            wallet: comment.author.wallet,
            avatar: comment.author.avatar,
          },
          likes: comment.likes || 0,
          parentCommentId: comment.parent_comment_id,
          isAnonymous: false,
          tipsAmount: 0,
          createdAt: comment.created_at,
          is_ai_generated: true,
          ai_model: "gpt-4o-mini",
        },
      };
    } catch (error) {
      this.logger.error("Failed to create AI reply:", error);
      return { success: false, error: "Failed to generate AI reply" };
    }
  }

  /**
   * Backfill AI feedback for all ideas that don't have AI comments yet
   */
  async backfillMissingAIFeedback(): Promise<{
    processed: number;
    success: number;
    failed: number;
    skipped: number;
    details: string[];
  }> {
    const supabase = this.supabaseService.getAdminClient();
    const result = {
      processed: 0,
      success: 0,
      failed: 0,
      skipped: 0,
      details: [] as string[],
    };

    this.logger.log("Starting AI feedback backfill...");

    try {
      // Get all ideas
      const { data: ideas, error: ideasError } = await supabase
        .from("projects")
        .select("id, title, problem, solution, opportunity")
        .eq("type", "idea")
        .not("problem", "is", null)
        .not("solution", "is", null);

      if (ideasError) {
        throw new Error(`Failed to fetch ideas: ${ideasError.message}`);
      }

      if (!ideas || ideas.length === 0) {
        return { ...result, details: ["No ideas found"] };
      }

      this.logger.log(`Found ${ideas.length} ideas to check`);

      // Get all existing AI comments
      const { data: aiComments, error: commentsError } = await supabase
        .from("comments")
        .select("project_id")
        .eq("is_ai_generated", true);

      if (commentsError) {
        throw new Error(
          `Failed to fetch AI comments: ${commentsError.message}`
        );
      }

      // Create a set of project IDs that already have AI feedback
      const projectsWithAI = new Set(
        (aiComments || []).map((c) => c.project_id)
      );

      // Filter ideas that don't have AI feedback
      const ideasWithoutFeedback = ideas.filter(
        (idea) => !projectsWithAI.has(idea.id)
      );

      this.logger.log(`${ideasWithoutFeedback.length} ideas need AI feedback`);

      // Get or create AI bot user
      let { data: aiUser } = await supabase
        .from("users")
        .select("id")
        .eq("email", "gimmeidea.contact@gmail.com")
        .single();

      if (!aiUser) {
        // Try by wallet
        const { data: aiUserByWallet } = await supabase
          .from("users")
          .select("id")
          .eq("wallet", "FzcnaZMYcoAYpLgr7Wym2b8hrKYk3VXsRxWSLuvZKLJm")
          .single();

        aiUser = aiUserByWallet;
      }

      if (!aiUser) {
        throw new Error("AI bot user not found");
      }

      // Process each idea (with delay to avoid rate limiting)
      for (const idea of ideasWithoutFeedback) {
        result.processed++;

        // Skip if content is too short
        const totalLength =
          (idea.problem || "").length + (idea.solution || "").length;
        if (totalLength < 50) {
          result.skipped++;
          result.details.push(`${idea.id}: Skipped - content too short`);
          continue;
        }

        try {
          // Generate AI feedback
          const feedback = await this.generateIdeaFeedback({
            title: idea.title,
            problem: idea.problem,
            solution: idea.solution,
            opportunity: idea.opportunity,
          });

          // Save AI score to project
          await supabase
            .from("projects")
            .update({ ai_score: feedback.score })
            .eq("id", idea.id);

          // Format comment content
          let commentContent = feedback.comment;

          if (feedback.strengths && feedback.strengths.length > 0) {
            commentContent += `\n\n**💪 Strengths:**\n${feedback.strengths
              .map((s) => `• ${s}`)
              .join("\n")}`;
          }

          if (feedback.weaknesses && feedback.weaknesses.length > 0) {
            commentContent += `\n\n**⚠️ Areas to Improve:**\n${feedback.weaknesses
              .map((w) => `• ${w}`)
              .join("\n")}`;
          }

          if (feedback.suggestions && feedback.suggestions.length > 0) {
            commentContent += `\n\n**💡 Suggestions:**\n${feedback.suggestions
              .map((s) => `• ${s}`)
              .join("\n")}`;
          }

          // Create AI comment
          const { error: commentError } = await supabase
            .from("comments")
            .insert({
              project_id: idea.id,
              user_id: aiUser.id,
              content: commentContent,
              is_anonymous: false,
              likes: 0,
              tips_amount: 0,
              is_ai_generated: true,
              ai_model: "gpt-4o-mini",
              created_at: new Date().toISOString(),
            });

          if (commentError) {
            throw new Error(commentError.message);
          }

          // Increment feedback count
          await supabase.rpc("increment_feedback_count", {
            project_id: idea.id,
          });

          result.success++;
          result.details.push(`${idea.id}: Success - Score ${feedback.score}`);

          this.logger.log(
            `AI feedback created for ${idea.id} with score ${feedback.score}`
          );

          // Add delay to avoid rate limiting (1 second between requests)
          await new Promise((resolve) => setTimeout(resolve, 1000));
        } catch (error: any) {
          result.failed++;
          result.details.push(`${idea.id}: Failed - ${error.message}`);
          this.logger.error(`Failed to process idea ${idea.id}:`, error);
        }
      }

      this.logger.log(
        `Backfill complete: ${result.success} success, ${result.failed} failed, ${result.skipped} skipped`
      );

      return result;
    } catch (error: any) {
      this.logger.error("Backfill failed:", error);
      throw error;
    }
  }

  // =============================================
  // RELATED PROJECTS DETECTION (Tavily API)
  // =============================================

  /**
   * Search for related projects on the internet using Tavily API
   * Called during idea submission
   */
  async searchRelatedProjects(
    ideaId: string,
    ideaTitle: string,
    ideaProblem: string,
    ideaSolution: string,
    userId: string
  ): Promise<{
    success: boolean;
    results?: RelatedProjectResult[];
    error?: string;
    quotaInfo?: { remaining: number; used: number; max: number };
  }> {
    this.logger.log(`Searching related projects for idea: ${ideaTitle}`);

    const supabase = this.supabaseService.getAdminClient();
    const tavilyApiKey = process.env.TAVILY_API_KEY;

    if (!tavilyApiKey) {
      this.logger.warn("TAVILY_API_KEY not configured");
      return { success: false, error: "Search service not configured" };
    }

    try {
      // Check user's daily quota
      const { data: quotaData, error: quotaError } = await supabase.rpc(
        "can_user_search_projects",
        { p_user_id: userId }
      );

      if (quotaError) {
        this.logger.error("Failed to check quota:", quotaError);
        throw new Error("Failed to check search quota");
      }

      const quota = {
        canSearch: quotaData?.canSearch ?? quotaData?.cansearch ?? false,
        remaining: quotaData?.remaining ?? 0,
        used: quotaData?.used ?? 0,
        max: quotaData?.max ?? 5,
      };

      if (!quota.canSearch) {
        return {
          success: false,
          error: "Daily search limit reached (5 ideas per day)",
          quotaInfo: {
            remaining: quota.remaining,
            used: quota.used,
            max: quota.max,
          },
        };
      }

      // Build search query from idea content
      const searchQuery = this.buildSearchQuery(
        ideaTitle,
        ideaProblem,
        ideaSolution
      );

      this.logger.log(`Tavily search query: ${searchQuery}`);

      // Call Tavily API (basic mode, max 8 results)
      const tavilyResponse = await fetch("https://api.tavily.com/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          api_key: tavilyApiKey,
          query: searchQuery,
          search_depth: "basic",
          max_results: 8,
          include_domains: [
            "github.com",
            "producthunt.com",
            "ycombinator.com",
            "betalist.com",
            "indiehackers.com",
          ],
          exclude_domains: [
            "medium.com",
            "dev.to",
            "hackernoon.com",
            "towardsdatascience.com",
            "freecodecamp.org",
            "reddit.com",
            "quora.com",
            "stackoverflow.com",
          ],
        }),
      });

      if (!tavilyResponse.ok) {
        const errorText = await tavilyResponse.text();
        this.logger.error(`Tavily API error: ${errorText}`);
        throw new Error("Search API request failed");
      }

      const tavilyData = await tavilyResponse.json();

      if (!tavilyData.results || tavilyData.results.length === 0) {
        // No results found, but still count as a search
        await supabase.rpc("increment_search_usage", { p_user_id: userId });
        return {
          success: true,
          results: [],
          quotaInfo: {
            remaining: quota.remaining - 1,
            used: quota.used + 1,
            max: quota.max,
          },
        };
      }

      // Transform and store results
      const results: RelatedProjectResult[] = tavilyData.results.map(
        (result: any) => ({
          title: result.title || "Untitled",
          url: result.url,
          snippet: result.content?.substring(0, 500) || "",
          source: this.extractDomain(result.url),
          score: result.score || 0,
        })
      );

      // Store results in database
      const insertData = results.map((r) => ({
        idea_id: ideaId,
        title: r.title,
        url: r.url,
        snippet: r.snippet,
        source: r.source,
        score: r.score,
        search_query: searchQuery,
      }));

      const { error: insertError } = await supabase
        .from("related_projects")
        .insert(insertData);

      if (insertError) {
        this.logger.error("Failed to store search results:", insertError);
        // Don't throw - still return results even if storage fails
      }

      // Increment search usage
      await supabase.rpc("increment_search_usage", { p_user_id: userId });

      this.logger.log(
        `Found ${results.length} related projects for idea ${ideaId}`
      );

      return {
        success: true,
        results,
        quotaInfo: {
          remaining: quota.remaining - 1,
          used: quota.used + 1,
          max: quota.max,
        },
      };
    } catch (error: any) {
      this.logger.error("Failed to search related projects:", error);
      return { success: false, error: error.message || "Search failed" };
    }
  }

  /**
   * Build an optimized search query from idea content
   */
  private buildSearchQuery(
    title: string,
    problem: string,
    solution: string
  ): string {
    // Combine title with key phrases from problem/solution
    // Keep it concise for better search results
    const titleWords = title.slice(0, 60);
    const problemWords = problem.slice(0, 100);

    // Create a focused query that finds actual products/tools
    // Extract key technical terms and product names
    const extractKeyTerms = (text: string): string[] => {
      // Remove common filler words
      const stopWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'that', 'this', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'should', 'could', 'may', 'might', 'can'];

      const words = text.toLowerCase()
        .replace(/[^\w\s]/g, ' ')
        .split(/\s+/)
        .filter(word => word.length > 3 && !stopWords.includes(word));

      return words.slice(0, 5); // Top 5 keywords
    };

    const titleKeywords = extractKeyTerms(title);
    const problemKeywords = extractKeyTerms(problem).slice(0, 3);

    // Build query with product-finding intent
    const keywords = [...new Set([...titleKeywords, ...problemKeywords])].join(' ');

    // Add modifiers to find actual products/tools, not blog posts
    return `${keywords} site:github.com OR site:producthunt.com OR platform tool app software -blog -"how to" -tutorial -guide`;
  }

  /**
   * Extract domain name from URL
   */
  private extractDomain(url: string): string {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname.replace("www.", "");
    } catch {
      return "unknown";
    }
  }

  /**
   * Get related projects for an idea
   */
  async getRelatedProjects(ideaId: string): Promise<{
    success: boolean;
    data?: {
      aiDetected: RelatedProjectResult[];
      userPinned: UserPinnedProject[];
    };
    error?: string;
  }> {
    const supabase = this.supabaseService.getAdminClient();

    try {
      const { data, error } = await supabase.rpc("get_related_projects", {
        p_idea_id: ideaId,
      });

      if (error) {
        this.logger.error("Failed to get related projects:", error);
        throw error;
      }

      return {
        success: true,
        data: {
          aiDetected: data?.aiDetected || data?.aidetected || [],
          userPinned: data?.userPinned || data?.userpinned || [],
        },
      };
    } catch (error: any) {
      this.logger.error("Failed to get related projects:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Pin user's own project to an idea
   */
  async pinUserProject(
    ideaId: string,
    userId: string,
    projectTitle: string,
    projectUrl: string,
    projectDescription?: string
  ): Promise<{ success: boolean; error?: string }> {
    const supabase = this.supabaseService.getAdminClient();

    try {
      // Validate URL
      try {
        new URL(projectUrl);
      } catch {
        return { success: false, error: "Invalid project URL" };
      }

      const { error } = await supabase.from("user_pinned_projects").upsert(
        {
          idea_id: ideaId,
          pinned_by: userId,
          project_title: projectTitle,
          project_url: projectUrl,
          project_description: projectDescription || null,
        },
        {
          onConflict: "idea_id,pinned_by",
        }
      );

      if (error) {
        this.logger.error("Failed to pin user project:", error);
        throw error;
      }

      this.logger.log(`User ${userId} pinned project to idea ${ideaId}`);
      return { success: true };
    } catch (error: any) {
      this.logger.error("Failed to pin user project:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Remove user's pinned project from an idea
   */
  async unpinUserProject(
    ideaId: string,
    userId: string
  ): Promise<{ success: boolean; error?: string }> {
    const supabase = this.supabaseService.getAdminClient();

    try {
      const { error } = await supabase
        .from("user_pinned_projects")
        .delete()
        .eq("idea_id", ideaId)
        .eq("pinned_by", userId);

      if (error) {
        this.logger.error("Failed to unpin user project:", error);
        throw error;
      }

      return { success: true };
    } catch (error: any) {
      this.logger.error("Failed to unpin user project:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get user's search quota
   */
  async getUserSearchQuota(userId: string): Promise<{
    canSearch: boolean;
    remaining: number;
    used: number;
    max: number;
  }> {
    const supabase = this.supabaseService.getAdminClient();

    try {
      const { data, error } = await supabase.rpc("can_user_search_projects", {
        p_user_id: userId,
      });

      if (error) throw error;

      return {
        canSearch: data?.canSearch ?? data?.cansearch ?? false,
        remaining: data?.remaining ?? 0,
        used: data?.used ?? 0,
        max: data?.max ?? 5,
      };
    } catch (error) {
      this.logger.error("Failed to get search quota:", error);
      return { canSearch: false, remaining: 0, used: 0, max: 5 };
    }
  }
}

// =============================================
// INTERFACES
// =============================================

export interface RelatedProjectResult {
  id?: string;
  title: string;
  url: string;
  snippet: string;
  source: string;
  score: number;
  isPinned?: boolean;
  pinnedBy?: string;
  createdAt?: string;
}

export interface UserPinnedProject {
  id: string;
  title: string;
  url: string;
  description?: string;
  pinnedBy: string;
  createdAt: string;
  user?: {
    username: string;
    avatar?: string;
  };
}
