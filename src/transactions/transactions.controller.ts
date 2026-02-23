/* eslint-disable */
import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
  Request,
  ParseIntPipe,
} from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('transactions')
@UseGuards(JwtAuthGuard)
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Post()
  create(@Request() req, @Body('listing_id', ParseIntPipe) listingId: number) {
    return this.transactionsService.create(req.user.id, listingId);
  }

  @Get('my')
  findMy(@Request() req) {
    return this.transactionsService.findMyTransactions(req.user.id);
  }

  @Get('my-sales')
  findMySales(@Request() req) {
    return this.transactionsService.findMySales(req.user.id);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.transactionsService.findOne(id, req.user.id);
  }
}
