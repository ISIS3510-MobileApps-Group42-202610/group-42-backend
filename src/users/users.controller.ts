/* eslint-disable */
import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  Request,
  Post,
  ParseIntPipe,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Get('me')
  getProfile(@Request() req) {
    return this.usersService.findOne(req.user.id);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.findOne(id);
  }

  @Patch('me')
  updateProfile(@Request() req, @Body() dto: any) {
    return this.usersService.update(req.user.id, dto);
  }

  @Get('me/wishlist')
  getWishlist(@Request() req) {
    return this.usersService.getWishlist(req.user.id);
  }

  @Post('me/wishlist/:listingId')
  addToWishlist(
    @Request() req,
    @Param('listingId', ParseIntPipe) listingId: number,
  ) {
    return this.usersService.addToWishlist(req.user.id, listingId);
  }

  @Delete('me/wishlist/:listingId')
  removeFromWishlist(
    @Request() req,
    @Param('listingId', ParseIntPipe) listingId: number,
  ) {
    return this.usersService.removeFromWishlist(req.user.id, listingId);
  }

  @Get('me/purchases')
  getPurchaseHistory(@Request() req) {
    return this.usersService.getPurchaseHistory(req.user.id);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.remove(id);
  }
}
