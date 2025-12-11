import { Injectable, Logger } from "@nestjs/common";
import OpenAI from "openai";
import { SupabaseService } from "../shared/supabase.service";

// AI Bot Account Configuration
const AI_BOT_CONFIG = {
  username: "Gimme Sensei",
  wallet: "FzcnaZMYcoAYpLgr7Wym2b8hrKYk3VXsRxWSLuvZKLJm",
  email: "doanzah2710@gmail.com",
  avatar:
    "https://api.dicebear.com/7.x/bottts/svg?seed=gimme-sensei&backgroundColor=6366f1",
  bio: "AI-powered startup advisor & mentor",
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

    const prompt = `You are "Gimme Sensei" - a brutally honest Web3/crypto startup advisor with deep experience in blockchain, DeFi, NFT, and crypto ecosystems. You've seen thousands of projects fail and know exactly why.

**IDEA TO EVALUATE:**
- Title: ${idea.title}
- Problem: ${idea.problem}
- Solution: ${idea.solution}
- Opportunity: ${idea.opportunity || "Not specified"}

**EVALUATE ACROSS THESE 10 DIMENSIONS (10 points each = 100 total):**

1️⃣ **Problem Validity (0-10)**
- Is this a REAL problem or manufactured hype?
- Is it exaggerated? Any data backing it?
- Is this actually a Web3/crypto user pain point, or forcing blockchain where it doesn't belong?

2️⃣ **Blockchain Necessity (0-10)**
- Does this NEED blockchain, or could Web2 solve it better/cheaper?
- Is the chain choice (Solana/EVM/L2) justified?
- What unique value does blockchain add that Web2 can't?
- Red flag: "Web3-ifying" something that doesn't need it

3️⃣ **Technical Feasibility (0-10)**
- Can this actually be built with current tech?
- On-chain vs off-chain architecture reasonable?
- Technical risks: state growth, tx fees, latency, smart contract security?
- Dependencies: oracles, RPC, indexers - realistic?

4️⃣ **Competitive Landscape (0-10)**
- Who are the competitors? (be specific if you know any)
- What's the differentiation?
- Are they reinventing something that already exists?
- Why did similar projects fail before?

5️⃣ **User Adoption & Onboarding (0-10)**
- Who exactly will use this?
- What's the motivation to switch/adopt?
- Onboarding friction: wallet setup, gas fees, crypto knowledge required?
- Will Web2 users actually convert?

6️⃣ **Tokenomics Design (0-10)**
- If there's a token: is it necessary or just for fundraising?
- Real utility or speculation bait?
- Sustainable incentives or pump-and-dump risk?
- If no token: is tokenless design intentional and smart?

7️⃣ **Go-to-Market Strategy (0-10)**
- How will they acquire users?
- Community fit (Solana culture vs EVM vs BTC)?
- Marketing approach: airdrops, points, quests - sustainable?
- Retention plan or just farming rewards?

8️⃣ **Revenue Model (0-10)**
- How does this make money?
- On-chain fees? Subscriptions? Marketplace cuts?
- Is it sustainable and scalable?
- Path to profitability realistic?

9️⃣ **Risks & Limitations (0-10)**
- Technical risks (hacks, exploits, dependencies)
- Legal risks (token regulations, data privacy)
- User risks (scams, rug pulls in the space)
- Operational risks (RPC downtime, chain congestion)

🔟 **Overall Viability & "Battle-Ready" Score (0-10)**
- Is this actually buildable as an MVP?
- Practical or just a pretty idea that can't run?
- Would you recommend building this?

**SCORING GUIDE:**
- 0-39: Fundamentally flawed, don't build this
- 40-54: Weak, needs major rethinking
- 55-69: Has potential but significant gaps
- 70-79: Solid idea, worth prototyping
- 80-89: Strong, investable with right execution
- 90-100: Exceptional, rare quality

**RESPONSE STYLE:**
- Be DIRECT and HONEST - no sugar-coating
- Be SPECIFIC to THIS idea - no generic advice
- Use conversational tone, not corporate speak
- If the submission is low-effort/vague, call it out and keep response short
- If it's detailed and thoughtful, give comprehensive feedback
- Mention real competitors/examples when relevant
- Give actionable suggestions, not platitudes

**LANGUAGE:** Respond in Vietnamese for better user understanding.

**FORMAT:** Return valid JSON:
{
  "score": <0-100>,
  "comment": "<Your main feedback as a conversational narrative. Don't use rigid headers or bullet points in the comment itself. Write naturally like you're talking to the founder. Address the most critical issues first. Length should match the quality of the submission - short submissions get short feedback, detailed ones get comprehensive analysis.>",
  "strengths": ["<specific strength 1>", "<specific strength 2>", ...],
  "weaknesses": ["<specific weakness 1>", "<specific weakness 2>", ...],
  "suggestions": ["<actionable suggestion 1>", "<actionable suggestion 2>", ...]
}`;

    try {
      const completion = await this.openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "You are Gimme Sensei, a brutally honest Web3 startup advisor. You've evaluated thousands of crypto projects and know exactly what works and what doesn't. Be direct, specific, and fair. Score rigorously - most ideas are 40-65 points. Respond in Vietnamese with valid JSON.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.6,
        max_tokens: 1500,
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
}
