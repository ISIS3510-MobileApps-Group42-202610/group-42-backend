/* eslint-disable */
import { Body, Controller, Post } from '@nestjs/common';
import { AiService } from './ai.service';

@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('enhance-description')
  enhanceDescription(@Body() body: {
    title: string;
    category: string;
    condition: string;
    description?: string;
  }) {
    return this.aiService.enhanceDescription(body);
  }
}