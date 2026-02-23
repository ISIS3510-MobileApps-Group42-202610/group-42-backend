/* eslint-disable */
import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
  Request,
  ParseIntPipe,
} from '@nestjs/common';
import { MessagesService } from './messages.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { IsString, IsInt } from 'class-validator';

class SendMessageDto {
  @IsInt()
  seller_id: number;

  @IsString()
  content: string;
}

@Controller('messages')
@UseGuards(JwtAuthGuard)
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Post()
  send(@Request() req, @Body() dto: SendMessageDto) {
    return this.messagesService.sendMessage(
      req.user.id,
      dto.seller_id,
      dto.content,
    );
  }

  @Get()
  getMyConversations(@Request() req) {
    return this.messagesService.getMyConversations(req.user.id);
  }

  @Get('seller/:sellerId')
  getConversation(
    @Request() req,
    @Param('sellerId', ParseIntPipe) sellerId: number,
  ) {
    return this.messagesService.getConversation(req.user.id, sellerId);
  }

  @Patch(':id/read')
  markAsRead(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.messagesService.markAsRead(id, req.user.id);
  }
}
