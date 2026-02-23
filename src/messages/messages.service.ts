import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Message, SentBy } from './message.entity';
import { Seller } from '../sellers/seller.entity';

@Injectable()
export class MessagesService {
  constructor(
    @InjectRepository(Message)
    private messagesRepository: Repository<Message>,
    @InjectRepository(Seller)
    private sellersRepository: Repository<Seller>,
  ) {}

  // ── Shared helpers ──────────────────────────────────────────────────────────

  private async resolveConversationParties(
    userId: number,
    sellerId: number,
  ): Promise<{ seller: Seller; buyerId: number; sentBy: SentBy }> {
    const seller = await this.sellersRepository.findOne({
      where: { id: sellerId },
    });
    if (!seller) throw new NotFoundException('Seller not found');

    // Check if the sender is the seller themselves
    const isSeller = seller.user_id === userId;
    const sentBy = isSeller ? SentBy.SELLER : SentBy.BUYER;

    // buyer_id always refers to the non-seller participant.
    // If the seller is initiating, we need the buyer_id supplied separately,
    // so this helper is only used for buyer-initiated sends.
    return { seller, buyerId: userId, sentBy };
  }

  // ── Send (buyer → seller) ───────────────────────────────────────────────────

  async sendMessageAsBuyer(buyerId: number, sellerId: number, content: string) {
    const seller = await this.sellersRepository.findOne({
      where: { id: sellerId },
    });
    if (!seller) throw new NotFoundException('Seller not found');

    if (seller.user_id === buyerId) {
      throw new ForbiddenException('You cannot message yourself');
    }

    const message = this.messagesRepository.create({
      buyer_id: buyerId,
      seller_id: sellerId,
      content,
      sent_by: SentBy.BUYER,
    });
    return this.messagesRepository.save(message);
  }

  // ── Send (seller → buyer) ───────────────────────────────────────────────────

  async sendMessageAsSeller(userId: number, buyerId: number, content: string) {
    // Verify the caller actually has a seller profile
    const seller = await this.sellersRepository.findOne({
      where: { user_id: userId },
    });
    if (!seller)
      throw new ForbiddenException('You do not have a seller profile');

    if (seller.user_id === buyerId) {
      throw new ForbiddenException('You cannot message yourself');
    }

    const message = this.messagesRepository.create({
      buyer_id: buyerId,
      seller_id: seller.id,
      content,
      sent_by: SentBy.SELLER,
    });
    return this.messagesRepository.save(message);
  }

  // ── Conversation between a buyer and a seller ───────────────────────────────

  async getConversation(userId: number, sellerId: number) {
    const seller = await this.sellersRepository.findOne({
      where: { id: sellerId },
    });
    if (!seller) throw new NotFoundException('Seller not found');

    // Works for both sides: buyer fetches by their own id,
    // seller fetches by checking their profile's user_id matches the seller record
    const isSeller = seller.user_id === userId;

    if (isSeller) {
      // Seller can specify which buyer's thread to view via query
      return this.messagesRepository.find({
        where: { seller_id: sellerId },
        order: { sent_at: 'ASC' },
        relations: ['buyer'],
      });
    }

    return this.messagesRepository.find({
      where: { buyer_id: userId, seller_id: sellerId },
      order: { sent_at: 'ASC' },
      relations: ['seller', 'seller.user'],
    });
  }

  // Seller views a specific thread with one buyer
  async getConversationWithBuyer(userId: number, buyerId: number) {
    const seller = await this.sellersRepository.findOne({
      where: { user_id: userId },
    });
    if (!seller)
      throw new ForbiddenException('You do not have a seller profile');

    return this.messagesRepository.find({
      where: { seller_id: seller.id, buyer_id: buyerId },
      order: { sent_at: 'ASC' },
      relations: ['buyer'],
    });
  }

  // ── List all conversations ──────────────────────────────────────────────────

  async getMyConversationsAsBuyer(userId: number) {
    return this.messagesRepository
      .createQueryBuilder('message')
      .leftJoinAndSelect('message.seller', 'seller')
      .leftJoinAndSelect('seller.user', 'sellerUser')
      .where('message.buyer_id = :userId', { userId })
      .orderBy('message.sent_at', 'DESC')
      .getMany();
  }

  async getMyConversationsAsSeller(userId: number) {
    const seller = await this.sellersRepository.findOne({
      where: { user_id: userId },
    });
    if (!seller)
      throw new ForbiddenException('You do not have a seller profile');

    return this.messagesRepository
      .createQueryBuilder('message')
      .leftJoinAndSelect('message.buyer', 'buyer')
      .where('message.seller_id = :sellerId', { sellerId: seller.id })
      .orderBy('message.sent_at', 'DESC')
      .getMany();
  }

  // ── Mark as read ────────────────────────────────────────────────────────────

  async markAsRead(messageId: number, userId: number) {
    const message = await this.messagesRepository.findOne({
      where: { id: messageId },
      relations: ['seller'],
    });
    if (!message) throw new NotFoundException('Message not found');

    const isSeller = message.seller?.user_id === userId;
    const isBuyer = message.buyer_id === userId;

    if (!isSeller && !isBuyer) {
      throw new ForbiddenException('You are not part of this conversation');
    }

    // Only mark as read if the message was sent by the other party
    if (isSeller && message.sent_by !== SentBy.BUYER) {
      throw new ForbiddenException('Can only mark buyer messages as read');
    }
    if (isBuyer && message.sent_by !== SentBy.SELLER) {
      throw new ForbiddenException('Can only mark seller messages as read');
    }

    await this.messagesRepository.update(messageId, { is_read: true });
    return { message: 'Marked as read' };
  }
}
