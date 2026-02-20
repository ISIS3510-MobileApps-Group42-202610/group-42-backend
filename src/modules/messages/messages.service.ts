import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Message } from './entities/message.entity';
import { CreateMessageDto, UpdateMessageDto } from './dtos/message.dto';
import { User } from '../users/entities/user.entity';

@Injectable()
export class MessagesService {
  constructor(
    @InjectRepository(Message)
    private readonly messageRepository: Repository<Message>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async sendMessage(senderId: string, createMessageDto: CreateMessageDto): Promise<Message> {
    const { receiverId } = createMessageDto;

    // Verify both users exist
    const sender = await this.userRepository.findOne({ where: { id: senderId } });
    if (!sender) {
      throw new NotFoundException('Sender not found');
    }

    const receiver = await this.userRepository.findOne({ where: { id: receiverId } });
    if (!receiver) {
      throw new NotFoundException('Receiver not found');
    }

    if (senderId === receiverId) {
      throw new BadRequestException('Cannot send message to yourself');
    }

    const message = this.messageRepository.create({
      ...createMessageDto,
      senderId,
    });

    return this.messageRepository.save(message);
  }

  async getMessageById(id: string): Promise<Message> {
    const message = await this.messageRepository.findOne({
      where: { id },
      relations: ['sender', 'receiver'],
    });
    if (!message) {
      throw new NotFoundException(`Message with ID ${id} not found`);
    }
    return message;
  }

  async getMessagesBetweenUsers(
    userId1: string,
    userId2: string,
    skip: number = 0,
    take: number = 10,
  ): Promise<[Message[], number]> {
    return this.messageRepository.findAndCount({
      where: [
        { senderId: userId1, receiverId: userId2 },
        { senderId: userId2, receiverId: userId1 },
      ],
      relations: ['sender', 'receiver'],
      skip,
      take,
      order: { sentAt: 'DESC' },
    });
  }

  async getUserInbox(userId: string, skip: number = 0, take: number = 10): Promise<[Message[], number]> {
    return this.messageRepository.findAndCount({
      where: { receiverId: userId },
      relations: ['sender'],
      skip,
      take,
      order: { sentAt: 'DESC' },
    });
  }

  async getUserSentMessages(
    userId: string,
    skip: number = 0,
    take: number = 10,
  ): Promise<[Message[], number]> {
    return this.messageRepository.findAndCount({
      where: { senderId: userId },
      relations: ['receiver'],
      skip,
      take,
      order: { sentAt: 'DESC' },
    });
  }

  async markMessageAsRead(id: string): Promise<Message> {
    const message = await this.getMessageById(id);
    message.isRead = true;
    return this.messageRepository.save(message);
  }

  async markMessagesAsRead(messageIds: string[]): Promise<void> {
    if (messageIds.length === 0) return;
    await this.messageRepository.update(
      { id: In(messageIds) },
      { isRead: true },
    );
  }

  async updateMessage(id: string, updateMessageDto: UpdateMessageDto): Promise<Message> {
    const message = await this.getMessageById(id);
    Object.assign(message, updateMessageDto);
    return this.messageRepository.save(message);
  }

  async deleteMessage(id: string): Promise<void> {
    const result = await this.messageRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Message with ID ${id} not found`);
    }
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.messageRepository.count({
      where: { receiverId: userId, isRead: false },
    });
  }

  async getRecentConversations(userId: string, skip: number = 0, take: number = 10) {
    const rawQuery = `
      SELECT DISTINCT ON (CASE WHEN "senderId" = $1 THEN "receiverId" ELSE "senderId" END)
             CASE WHEN "senderId" = $1 THEN "receiverId" ELSE "senderId" END as "conversationPartnerId",
             MAX("sentAt") as "lastMessageTime"
      FROM messages
      WHERE "senderId" = $1 OR "receiverId" = $1
      GROUP BY CASE WHEN "senderId" = $1 THEN "receiverId" ELSE "senderId" END
      ORDER BY CASE WHEN "senderId" = $1 THEN "receiverId" ELSE "senderId" END, MAX("sentAt") DESC
      OFFSET $2 LIMIT $3
    `;

    return this.messageRepository.query(rawQuery, [userId, skip, take]);
  }
}
