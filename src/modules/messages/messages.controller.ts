import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { MessagesService } from './messages.service';
import {
  CreateMessageDto,
  UpdateMessageDto,
  MessageResponseDto,
  MessageDetailResponseDto,
} from './dtos/message.dto';

@Controller('api/messages')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async sendMessage(
    @Query('senderId') senderId: string,
    @Body() createMessageDto: CreateMessageDto,
  ): Promise<MessageResponseDto> {
    const message = await this.messagesService.sendMessage(senderId, createMessageDto);
    return this.mapMessageToDto(message);
  }

  @Get(':id')
  async getMessageById(@Param('id') id: string): Promise<MessageDetailResponseDto> {
    const message = await this.messagesService.getMessageById(id);
    return this.mapMessageToDetailDto(message);
  }

  @Get('conversation/:userId/:otherUserId')
  async getMessagesBetweenUsers(
    @Param('userId') userId: string,
    @Param('otherUserId') otherUserId: string,
    @Query('skip') skip: number = 0,
    @Query('take') take: number = 10,
  ): Promise<{ data: MessageDetailResponseDto[]; total: number }> {
    const [messages, total] = await this.messagesService.getMessagesBetweenUsers(
      userId,
      otherUserId,
      skip,
      take,
    );
    return {
      data: messages.map((m) => this.mapMessageToDetailDto(m)),
      total,
    };
  }

  @Get('inbox/:userId')
  async getUserInbox(
    @Param('userId') userId: string,
    @Query('skip') skip: number = 0,
    @Query('take') take: number = 10,
  ): Promise<{ data: MessageResponseDto[]; total: number }> {
    const [messages, total] = await this.messagesService.getUserInbox(userId, skip, take);
    return {
      data: messages.map((m) => this.mapMessageToDto(m)),
      total,
    };
  }

  @Get('sent/:userId')
  async getUserSentMessages(
    @Param('userId') userId: string,
    @Query('skip') skip: number = 0,
    @Query('take') take: number = 10,
  ): Promise<{ data: MessageResponseDto[]; total: number }> {
    const [messages, total] = await this.messagesService.getUserSentMessages(userId, skip, take);
    return {
      data: messages.map((m) => this.mapMessageToDto(m)),
      total,
    };
  }

  @Get('unread-count/:userId')
  async getUnreadCount(@Param('userId') userId: string): Promise<{ unreadCount: number }> {
    const unreadCount = await this.messagesService.getUnreadCount(userId);
    return { unreadCount };
  }

  @Patch(':id/mark-as-read')
  async markMessageAsRead(@Param('id') id: string): Promise<MessageResponseDto> {
    const message = await this.messagesService.markMessageAsRead(id);
    return this.mapMessageToDto(message);
  }

  @Patch(':id')
  async updateMessage(
    @Param('id') id: string,
    @Body() updateMessageDto: UpdateMessageDto,
  ): Promise<MessageResponseDto> {
    const message = await this.messagesService.updateMessage(id, updateMessageDto);
    return this.mapMessageToDto(message);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteMessage(@Param('id') id: string): Promise<void> {
    await this.messagesService.deleteMessage(id);
  }

  private mapMessageToDto(message: any): MessageResponseDto {
    return {
      id: message.id,
      content: message.content,
      senderId: message.senderId,
      receiverId: message.receiverId,
      sentAt: message.sentAt,
      isRead: message.isRead,
    };
  }

  private mapMessageToDetailDto(message: any): MessageDetailResponseDto {
    return {
      ...this.mapMessageToDto(message),
      sender: message.sender
        ? {
            id: message.sender.id,
            fullName: message.sender.fullName,
            profilePhotoUrl: message.sender.profilePhotoUrl,
          }
        : undefined,
      receiver: message.receiver
        ? {
            id: message.receiver.id,
            fullName: message.receiver.fullName,
            profilePhotoUrl: message.receiver.profilePhotoUrl,
          }
        : undefined,
    };
  }
}
