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

class BuyerSendMessageDto {
  @IsInt()
  seller_id: number;

  @IsString()
  content: string;
}

class SellerSendMessageDto {
  @IsInt()
  buyer_id: number;

  @IsString()
  content: string;
}

@Controller('messages')
@UseGuards(JwtAuthGuard)
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  // ── Send ────────────────────────────────────────────────────────────────────

  /** Buyer sends a message to a seller */
  @Post('buyer')
  sendAsBuyer(@Request() req, @Body() dto: BuyerSendMessageDto) {
    return this.messagesService.sendMessageAsBuyer(
      req.user.id,
      dto.seller_id,
      dto.content,
    );
  }

  /** Seller sends a message to a buyer */
  @Post('seller')
  sendAsSeller(@Request() req, @Body() dto: SellerSendMessageDto) {
    return this.messagesService.sendMessageAsSeller(
      req.user.id,
      dto.buyer_id,
      dto.content,
    );
  }

  // ── Conversations list ──────────────────────────────────────────────────────

  /** Get all conversations where I am the buyer */
  @Get('as-buyer')
  getMyConversationsAsBuyer(@Request() req) {
    return this.messagesService.getMyConversationsAsBuyer(req.user.id);
  }

  /** Get all conversations where I am the seller */
  @Get('as-seller')
  getMyConversationsAsSeller(@Request() req) {
    return this.messagesService.getMyConversationsAsSeller(req.user.id);
  }

  // ── Thread views ────────────────────────────────────────────────────────────

  /** Buyer views thread with a specific seller */
  @Get('thread/seller/:sellerId')
  getConversationWithSeller(
    @Request() req,
    @Param('sellerId', ParseIntPipe) sellerId: number,
  ) {
    return this.messagesService.getConversation(req.user.id, sellerId);
  }

  /** Seller views thread with a specific buyer */
  @Get('thread/buyer/:buyerId')
  getConversationWithBuyer(
    @Request() req,
    @Param('buyerId', ParseIntPipe) buyerId: number,
  ) {
    return this.messagesService.getConversationWithBuyer(req.user.id, buyerId);
  }

  // ── Mark as read ────────────────────────────────────────────────────────────

  @Patch(':id/read')
  markAsRead(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.messagesService.markAsRead(id, req.user.id);
  }
}
