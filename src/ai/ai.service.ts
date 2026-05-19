/* eslint-disable */
import {
  Injectable,
  InternalServerErrorException,
  BadRequestException,
} from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';

@Injectable()
export class AiService {
  async enhanceDescription(body: {
    title?: string;
    category?: string;
    condition?: string;
    description?: string;
  }) {
    const title = body?.title?.trim() ?? '';
    const category = body?.category?.trim() || 'Other';
    const condition = body?.condition?.trim() || 'Good';
    const description = body?.description?.trim() ?? '';

    if (!title && !description) {
      throw new BadRequestException(
        'title or description is required',
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      throw new InternalServerErrorException(
        'GEMINI_API_KEY is not configured',
      );
    }

    try {
      const genAI = new GoogleGenerativeAI(apiKey);

      const model = genAI.getGenerativeModel({
        model: 'gemini-3.1-flash-lite',
      });

      const prompt = `
You are improving a product description for a university marketplace.

Return ONLY the final product description.
Do not use markdown.
Do not use bullets.
Do not use headings.
Do not include title, category, condition, notes, labels, seller tips, or extra explanations.
Do not use asterisks.
Maximum 420 characters.

Product title: ${title}
Category: ${category}
Condition: ${condition}
Current description: ${description}

Write a natural, trustworthy, concise description in English.
If the category is Other, still generate a useful generic marketplace description.
Do not invent specific brand, model, technical specs, accessories, or battery condition.
`;

      const result = await model.generateContent(prompt);
      const text = result.response.text();

      if (!text || !text.trim()) {
        throw new Error('Gemini returned an empty response');
      }

      return {
        enhanced_description: this.cleanOutput(text),
      };
    } catch (error: any) {
      console.error('[AI_SERVICE] Gemini error:', {
        message: error?.message,
        status: error?.status,
        name: error?.name,
        details: error?.errorDetails,
      });

      return {
        enhanced_description: this.buildFallbackDescription({
          title,
          category,
          condition,
          description,
        }),
      };
    }
  }

  private cleanOutput(text: string): string {
    return text
      .replace(/\*\*/g, '')
      .replace(/\*/g, '')
      .replace(/#+/g, '')
      .replace(/^description:\s*/i, '')
      .replace(/^product description:\s*/i, '')
      .trim()
      .slice(0, 420);
  }

  private buildFallbackDescription(body: {
    title: string;
    category: string;
    condition: string;
    description: string;
  }): string {
    const titlePart = body.title || 'This item';

    const base = `${titlePart} is available in ${body.condition.toLowerCase()} condition. It is a practical option for university students looking for an affordable and useful item. Please check the details with the seller before purchase.`;

    return base.slice(0, 420);
  }
}