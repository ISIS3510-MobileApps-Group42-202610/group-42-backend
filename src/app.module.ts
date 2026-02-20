import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from './modules/users/users.module';
import { ListingsModule } from './modules/listings/listings.module';
import { TransactionsModule } from './modules/transactions/transactions.module';
import { MessagesModule } from './modules/messages/messages.module';
import { ReviewsModule } from './modules/reviews/reviews.module';
import { CoursesModule } from './modules/courses/courses.module';
import { PriceHistoryModule } from './modules/price-history/price-history.module';

const stage = process.env.STAGE ?? process.env.NODE_ENV ?? 'dev';
const isProd = stage === 'prod' || stage === 'production';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        url: configService.get('DATABASE_URL'),
        autoLoadEntities: true,
        synchronize: !isProd,
        logging: !isProd,
        ssl: {
          rejectUnauthorized: false,
        },
      }),
    }),
    UsersModule,
    ListingsModule,
    TransactionsModule,
    MessagesModule,
    ReviewsModule,
    CoursesModule,
    PriceHistoryModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
