import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { SellersModule } from './sellers/sellers.module';
import { ListingsModule } from './listings/listings.module';
import { TransactionsModule } from './transactions/transactions.module';
import { ReviewsModule } from './reviews/reviews.module';
import { MessagesModule } from './messages/messages.module';
import { CoursesModule } from './courses/courses.module';

import { User } from './users/user.entity';
import { Seller } from './sellers/seller.entity';
import { Listing } from './listings/listing.entity';
import { ListingImage } from './listings/listing-image.entity';
import { HistoricPrice } from './listings/historic-price.entity';
import { Transaction } from './transactions/transaction.entity';
import { Review } from './reviews/review.entity';
import { Message } from './messages/message.entity';
import { Course } from './courses/course.entity';

const stage = process.env.STAGE ?? process.env.NODE_ENV ?? 'dev';
const isProd = stage === 'prod' || stage === 'production';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      autoLoadEntities: true,
      synchronize: !isProd,
      ssl: true,
      extra: {
        ssl: {
          rejectUnauthorized: false,
        },
      },
    }),
    AuthModule,
    UsersModule,
    SellersModule,
    ListingsModule,
    TransactionsModule,
    ReviewsModule,
    MessagesModule,
    CoursesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
