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
import { TransactionsService } from './transactions.service';
import {
  CreateTransactionDto,
  UpdateTransactionDto,
  TransactionResponseDto,
  TransactionDetailResponseDto,
} from './dtos/transaction.dto';

@Controller('api/transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createTransaction(
    @Body() createTransactionDto: CreateTransactionDto,
  ): Promise<TransactionResponseDto> {
    const transaction = await this.transactionsService.createTransaction(createTransactionDto);
    return this.mapTransactionToDto(transaction);
  }

  @Get(':id')
  async getTransactionById(@Param('id') id: string): Promise<TransactionDetailResponseDto> {
    const transaction = await this.transactionsService.getTransactionById(id);
    return this.mapTransactionToDetailDto(transaction);
  }

  @Get('buyer/:buyerId')
  async getTransactionsByBuyer(
    @Param('buyerId') buyerId: string,
    @Query('skip') skip: number = 0,
    @Query('take') take: number = 10,
  ): Promise<{ data: TransactionResponseDto[]; total: number }> {
    const [transactions, total] = await this.transactionsService.getTransactionsByBuyer(
      buyerId,
      skip,
      take,
    );
    return {
      data: transactions.map((t) => this.mapTransactionToDto(t)),
      total,
    };
  }

  @Get('seller/:sellerId')
  async getTransactionsBySeller(
    @Param('sellerId') sellerId: string,
    @Query('skip') skip: number = 0,
    @Query('take') take: number = 10,
  ): Promise<{ data: TransactionResponseDto[]; total: number }> {
    const [transactions, total] = await this.transactionsService.getTransactionsBySeller(
      sellerId,
      skip,
      take,
    );
    return {
      data: transactions.map((t) => this.mapTransactionToDto(t)),
      total,
    };
  }

  @Patch(':id')
  async updateTransaction(
    @Param('id') id: string,
    @Body() updateTransactionDto: UpdateTransactionDto,
  ): Promise<TransactionResponseDto> {
    const transaction = await this.transactionsService.updateTransaction(id, updateTransactionDto);
    return this.mapTransactionToDto(transaction);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteTransaction(@Param('id') id: string): Promise<void> {
    await this.transactionsService.deleteTransaction(id);
  }

  private mapTransactionToDto(transaction: any): TransactionResponseDto {
    return {
      id: transaction.id,
      buyerId: transaction.buyerId,
      sellerId: transaction.sellerId,
      listingId: transaction.listingId,
      agreedPrice: transaction.agreedPrice,
      status: transaction.status,
      meetingLocation: transaction.meetingLocation,
      meetingDateTime: transaction.meetingDateTime,
      createdAt: transaction.createdAt,
      updatedAt: transaction.updatedAt,
    };
  }

  private mapTransactionToDetailDto(transaction: any): TransactionDetailResponseDto {
    return {
      ...this.mapTransactionToDto(transaction),
      buyer: transaction.buyer
        ? {
            id: transaction.buyer.id,
            fullName: transaction.buyer.fullName,
            universityEmail: transaction.buyer.universityEmail,
          }
        : undefined,
      seller: transaction.seller
        ? {
            id: transaction.seller.id,
            fullName: transaction.seller.fullName,
            universityEmail: transaction.seller.universityEmail,
          }
        : undefined,
      listing: transaction.listing
        ? {
            id: transaction.listing.id,
            title: transaction.listing.title,
            sellingPrice: transaction.listing.sellingPrice,
          }
        : undefined,
    };
  }
}
