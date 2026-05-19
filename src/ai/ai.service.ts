/* eslint-disable */
import { Injectable } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';

@Injectable()
export class AiService {
  private readonly genAI = new GoogleGenerativeAI(
    process.env.GEMINI_API_KEY ?? '',
  );

  async enhanceDescription(body: {
    title: string;
    category: string;
    condition: string;
    description?: string;
  }) {
    const model = this.genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
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

    return {
      enhanced_description: result.response.text(),
    };
  }
}