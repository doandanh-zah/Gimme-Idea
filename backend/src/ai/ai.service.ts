import { Injectable, Logger } from "@nestjs/common";
import OpenAI from "openai";
import { SupabaseService } from "../shared/supabase.service";

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

    const prompt = `You are a strict, experienced startup investor with Y Combinator background. Evaluate this business idea with high standards for startup success.

**Idea Title:** ${idea.title}

**Problem:**
${idea.problem}

**Solution:**
${idea.solution}

**Opportunity:**
${idea.opportunity || "Not specified"}

**SCORING CRITERIA (Total 100 points):**
1. Problem & Solution Fit (30 pts)
Evaluate how painfully real the problem is + how logically strong the solution is.
Breakdown:
- Problem clarity (0-10 pts):
0-3: Vague or generic
4-7: Real but not urgent
8-10: Clear, painful, urgent, backed by strong insight
- Solution relevance (0-10 pts):
0-3: Weak or mismatched
4-7: Reasonable but not convincing
8-10: Direct, logical, high-probability effectiveness
- User insight depth (0-10 pts):
0-3: Surface-level
4-7: Moderate understanding
8-10: Deep, non-obvious insight

2. Market Opportunity (25 pts)
Breakdown:
- Market size (0-10 pts):
0-3: Small/niche
4-7: Medium
8-10: >$1B or very high demand
- Timing & trends (0-8 pts):
0-2: Poor timing
3-5: Neutral
6-8: Perfect timing, strong macro tailwinds
- Growth potential (0-7 pts):
0-2: Stagnant
3-5: Moderate growth
6-7: High velocity / explosive category

3. Competitive Advantage (20 pts)
Breakdown:
- Differentiation clarity (0-8 pts):
0-3: Weak difference
4-6: Somewhat unique
7-8: Clear, strong point of difference
- Moat potential (0-7 pts):
0-2: None
3-5: Possible but not strong
6-7: Realistic future moat (network effects, data, IP…)
- Defensibility at idea level (0-5 pts):
0-1: No defensibility
2-3: Some barriers exist
4-5: Strong conceptual defensibility

4. Innovation Level (15 pts)
Breakdown:
- Originality (0-6 pts):
0-2: Common idea
3-4: Somewhat new
5-6: Fresh, unique insight
- Technical/conceptual difficulty (0-5 pts):
0-1: Trivial
2-3: Moderate
4-5: Complex or breakthrough
- Creative leap / boldness (0-4 pts):
0-1: Safe
2-3: Good creativity
4: High-level innovation

5. Scalability (10 pts)
Breakdown:
10x-100x potential (0-5 pts):
0-1: Hard to scale
2-3: Possibly scalable
4-5: Strong exponential potential
Global applicability (0-3 pts):
0: Local-only
1-2: Regional
3: Globally relevant
User growth dynamics (0-2 pts):
0: Linear
1: Moderate user-growth loops
2: Viral/viral-adjacent dynamics

**BE STRICT:**
- Average ideas: 40-60 points
- Good ideas with potential: 65-75 points
- Great ideas worth investing: 80-90 points
- Only exceptional, unicorn-potential ideas: 90+ points

Provide your assessment in English for better user understanding.

Format your response as JSON:
{
  "score": <number 0-100>,
  "strengths": ["strength 1", "strength 2", "strength 3"],
  "weaknesses": ["weaknesses 1", "weaknesses 2", "weaknesses 3","weaknesses..."],
  "suggestions": ["suggestion 1", "suggestion 2", "suggestion 3"],
  "comment": "Comment and reply based on the quality of the post, whether it is long or not, if they post quality content then reply long and complete enough to deserve what they post. But if they post incomplete content, too short and lacking information then reply just enough."
}`;

    try {
      const completion = await this.openai.chat.completions.create({
        model: "gpt-4o-mini", // Using faster, cheaper model
        messages: [
          {
            role: "system",
            content:
              "You are a strict startup investor evaluating ideas for investment. Be encouraging but maintain high standards. Score rigorously - most ideas should be 40-70 points. Always respond with valid JSON in Vietnamese.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.5, // Reduced for more consistent, rigorous scoring
        max_tokens: 1000,
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

    const contextPrompt = `You are a strict, experienced startup advisor with a background in venture capital (Y Combinator, Sequoia level). 

**THE IDEA BEING DISCUSSED:**
- Title: ${ideaContext.title}
- Problem: ${ideaContext.problem}
- Solution: ${ideaContext.solution}
${ideaContext.opportunity ? `- Opportunity: ${ideaContext.opportunity}` : ""}

${
  previousAIComment ? `**YOUR PREVIOUS FEEDBACK:**\n${previousAIComment}\n` : ""
}

**YOUR PERSONALITY & RULES:**
1. Be REALISTIC and PRACTICAL - no sugar-coating, no hype
2. Focus on MARKET REALITY - real competition, real user behavior, real business models
3. Be DIRECT and CONCISE - 2-4 sentences max, get to the point
4. If the question is vague, ask for clarification
5. If the idea has fundamental flaws, say so politely but firmly
6. Reference REAL examples, competitors, or market data when relevant
7. Don't give generic startup advice - be SPECIFIC to this idea
8. You can be critical but always CONSTRUCTIVE and PROFESSIONAL
9. If you don't know something, admit it
10. Respond in the SAME LANGUAGE as the user's question

**AVOID:**
- Overly optimistic or encouraging responses
- Generic startup buzzwords
- Saying "great question" or similar fillers
- Being rude or dismissive (be firm but respectful)`;

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
        temperature: 0.6,
        max_tokens: 300,
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

      if (error) throw error;

      return {
        canUse: data.canUse,
        freeRemaining: data.freeRemaining,
        paidCredits: data.paidCredits,
        interactionsUsed: data.interactionsUsed,
        maxFreeInteractions: data.maxFreeInteractions,
      };
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

    const systemPrompt = `You're a friendly startup advisor helping someone find and develop business ideas.

About them:
- Interest: ${context.interest}
- Strengths: ${context.strengths}

Be helpful and natural in your responses. Keep it conversational - like you're talking to a friend over coffee. No need to be overly formal or follow rigid templates. Keep responses concise (2-3 sentences) but meaningful.`;

    const messages = [
      {
        role: "system",
        content: systemPrompt,
      },
      ...history,
      {
        role: "user",
        content: message,
      },
    ];

    try {
      const completion = await this.openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: messages as any,
        temperature: 0.7,
        max_tokens: 200,
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

      // Get or create AI bot user
      const { data: aiUser, error: userError } = await supabase
        .from("users")
        .select("id")
        .eq("username", "Gimme AI")
        .single();

      if (userError || !aiUser) {
        // Create AI user if doesn't exist
        const { data: newAiUser, error: createError } = await supabase
          .from("users")
          .insert({
            username: "Gimme AI",
            wallet: "AI_SYSTEM_WALLET",
            avatar:
              "https://api.dicebear.com/7.x/bottts/svg?seed=gimme-ai&backgroundColor=6366f1",
            reputation_score: 1000,
            balance: 0,
            bio: "AI-powered startup advisor",
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
}
