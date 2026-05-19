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
    if (!body.title || !body.category || !body.condition) {
      throw new BadRequestException(
        'title, category and condition are required',
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
        model: 'gemini-2.0-flash',
      });

      const prompt = `
Create a short marketplace product description for a university student marketplace.

Title: ${body.title}
Category: ${body.category}
Condition: ${body.condition}
Current description: ${body.description ?? ''}

Rules:
- Write in English.
- Maximum 80 words.
- Sound natural and trustworthy.
- Do not invent technical specs.
- Mention useful details the seller should add if missing.
`;

      const result = await model.generateContent(prompt);
      const text = result.response.text();

      return {
        enhanced_description: text.trim(),
      };
    } catch (error) {
      console.error('[AI_SERVICE] Gemini error:', error);

      throw new InternalServerErrorException(
        'Could not generate enhanced description',
      );
    }
  }
}