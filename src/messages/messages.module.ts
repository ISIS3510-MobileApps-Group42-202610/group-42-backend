import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MessagesController } from './messages.controller';
import { MessagesService } from './messages.service';
import { Message } from './message.entity';
import { Seller } from '../sellers/seller.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Message, Seller])],
  controllers: [MessagesController],
  providers: [MessagesService],
})
export class MessagesModule {}
