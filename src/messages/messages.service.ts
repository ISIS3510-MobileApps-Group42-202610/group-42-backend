import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Message } from './message.entity';
import { Seller } from '../sellers/seller.entity';

@Injectable()
export class MessagesService {
  constructor(
    @InjectRepository(Message)
    private messagesRepository: Repository<Message>,
    @InjectRepository(Seller)
    private sellersRepository: Repository<Seller>,
  ) {}

  async sendMessage(buyerId: number, sellerId: number, content: string) {
    const seller = await this.sellersRepository.findOne({
      where: { id: sellerId },
    });
    if (!seller) throw new NotFoundException('Seller not found');

    const message = this.messagesRepository.create({
      buyer_id: buyerId,
      seller_id: sellerId,
      content,
    });
    return this.messagesRepository.save(message);
  }

  async getConversation(userId: number, sellerId: number) {
    return this.messagesRepository.find({
      where: [
        { buyer_id: userId, seller_id: sellerId },
        { buyer_id: userId, seller_id: sellerId },
      ],
      order: { sent_at: 'ASC' },
    });
  }

  async getMyConversations(userId: number) {
    return this.messagesRepository
      .createQueryBuilder('message')
      .leftJoinAndSelect('message.seller', 'seller')
      .leftJoinAndSelect('seller.user', 'sellerUser')
      .where('message.buyer_id = :userId', { userId })
      .orderBy('message.sent_at', 'DESC')
      .getMany();
  }

  async markAsRead(messageId: number, userId: number) {
    const message = await this.messagesRepository.findOne({
      where: { id: messageId },
      relations: ['seller'],
    });
    if (!message) throw new NotFoundException('Message not found');

    const isSeller = message.seller?.user_id === userId;
    if (!isSeller)
      throw new ForbiddenException('Only the seller can mark messages as read');

    await this.messagesRepository.update(messageId, { is_read: true });
    return { message: 'Marked as read' };
  }
}
