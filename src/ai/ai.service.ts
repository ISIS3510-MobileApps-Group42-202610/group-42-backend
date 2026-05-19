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
    title: string;
    category: string;
    condition: string;
    description?: string;
  }) {
    if (!body?.title || !body?.category || !body?.condition) {
      throw new BadRequestException(
        'title, category and condition are required',
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      console.error('[AI_SERVICE] Missing GEMINI_API_KEY');

      throw new InternalServerErrorException(
        'GEMINI_API_KEY is not configured',
      );
    }

    try {
      const genAI = new GoogleGenerativeAI(apiKey);

      const model = genAI.getGenerativeModel({
        model: 'gemini-2.5-flash-lite',
      });

      const prompt = `
Create a short marketplace product description for a university student marketplace.

Title: ${body.title.trim()}
Category: ${body.category.trim()}
Condition: ${body.condition.trim()}
Current description: ${body.description?.trim() ?? ''}

Rules:
- Write in English.
- Maximum 80 words.
- Sound natural and trustworthy.
- Do not invent technical specs.
- Mention useful details the seller should add if missing.
`;

      const result = await model.generateContent(prompt);
      const text = result.response.text();

      if (!text || !text.trim()) {
        throw new Error('Gemini returned an empty response');
      }

      return {
        enhanced_description: text.trim(),
      };
    } catch (error: any) {
      console.error('[AI_SERVICE] Gemini error:', {
        message: error?.message,
        status: error?.status,
        name: error?.name,
        details: error?.errorDetails,
        stack: error?.stack,
      });

      throw new InternalServerErrorException({
        message: 'Could not generate enhanced description',
        error: error?.message ?? 'Unknown Gemini error',
      });
    }
  }
}