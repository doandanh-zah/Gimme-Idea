import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

export interface ProjectFeedback {
  strengths: string[];
  concerns: string[];
  suggestions: string[];
  questions: string[];
  summary: string;
}

@Injectable()
export class AIService {
  private readonly logger = new Logger(AIService.name);
  private openai: OpenAI | null = null;
  private isEnabled: boolean = false;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');

    if (apiKey) {
      this.openai = new OpenAI({ apiKey });
      this.isEnabled = true;
      this.logger.log('✅ AI Service initialized with OpenAI');
    } else {
      this.logger.warn('⚠️  OpenAI API key not found. AI feedback disabled.');
    }
  }

  /**
   * Check if AI service is available
   */
  isAIEnabled(): boolean {
    return this.isEnabled;
  }

  /**
   * Generate AI feedback for a project/idea
   */
  async generateProjectFeedback(
    title: string,
    description: string,
    category?: string,
    tags?: string[],
  ): Promise<ProjectFeedback | null> {
    if (!this.isEnabled || !this.openai) {
      this.logger.warn('AI feedback requested but service is disabled');
      return null;
    }

    try {
      const prompt = this.buildFeedbackPrompt(title, description, category, tags);

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: `You are an expert advisor for Solana blockchain projects and Web3 ideas.
Your role is to provide constructive, insightful feedback on new project proposals.
Always be encouraging while being honest about potential challenges.
Respond in the same language as the project description (Vietnamese or English).
Format your response as JSON with these fields:
{
  "strengths": ["strength 1", "strength 2", ...],
  "concerns": ["concern 1", "concern 2", ...],
  "suggestions": ["suggestion 1", "suggestion 2", ...],
  "questions": ["question 1", "question 2", ...],
  "summary": "brief overall assessment"
}`,
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.7,
        max_tokens: 1500,
      });

      const responseContent = completion.choices[0]?.message?.content;
      if (!responseContent) {
        throw new Error('No response from OpenAI');
      }

      const feedback = JSON.parse(responseContent) as ProjectFeedback;

      this.logger.log(`✅ Generated AI feedback for: "${title}"`);
      return feedback;

    } catch (error) {
      this.logger.error('Failed to generate AI feedback', error);
      return null;
    }
  }

  /**
   * Format feedback as a human-readable comment
   */
  formatFeedbackAsComment(feedback: ProjectFeedback): string {
    let comment = `${feedback.summary}\n\n`;

    if (feedback.strengths.length > 0) {
      comment += `**💪 Điểm mạnh / Strengths:**\n`;
      feedback.strengths.forEach((s, i) => {
        comment += `${i + 1}. ${s}\n`;
      });
      comment += '\n';
    }

    if (feedback.concerns.length > 0) {
      comment += `**⚠️ Những điểm cần lưu ý / Concerns:**\n`;
      feedback.concerns.forEach((c, i) => {
        comment += `${i + 1}. ${c}\n`;
      });
      comment += '\n';
    }

    if (feedback.suggestions.length > 0) {
      comment += `**💡 Đề xuất / Suggestions:**\n`;
      feedback.suggestions.forEach((s, i) => {
        comment += `${i + 1}. ${s}\n`;
      });
      comment += '\n';
    }

    if (feedback.questions.length > 0) {
      comment += `**❓ Câu hỏi để làm rõ / Questions:**\n`;
      feedback.questions.forEach((q, i) => {
        comment += `${i + 1}. ${q}\n`;
      });
    }

    return comment.trim();
  }

  /**
   * Build prompt for OpenAI
   */
  private buildFeedbackPrompt(
    title: string,
    description: string,
    category?: string,
    tags?: string[],
  ): string {
    let prompt = `Please analyze this Solana/Web3 project idea and provide constructive feedback:\n\n`;
    prompt += `**Title:** ${title}\n\n`;
    prompt += `**Description:** ${description}\n\n`;

    if (category) {
      prompt += `**Category:** ${category}\n\n`;
    }

    if (tags && tags.length > 0) {
      prompt += `**Tags:** ${tags.join(', ')}\n\n`;
    }

    prompt += `Please provide:
1. 2-3 key strengths of this idea
2. 2-3 potential concerns or challenges
3. 2-3 actionable suggestions for improvement
4. 2-3 clarifying questions to better understand the project
5. A brief summary (1-2 sentences)`;

    return prompt;
  }
}
