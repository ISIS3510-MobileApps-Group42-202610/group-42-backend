/* eslint-disable */
import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
  ParseIntPipe,
} from '@nestjs/common';
import { ListingsService } from './listings.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateListingDto, UpdateListingDto, AddImageDto } from './listing.dto';

@Controller('listings')
export class ListingsController {
  constructor(private readonly listingsService: ListingsService) {}

  @Get()
  findAll(
    @Query('category') category?: string,
    @Query('condition') condition?: string,
  ) {
    return this.listingsService.findAll(category, condition);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.listingsService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Request() req, @Body() dto: CreateListingDto) {
    return this.listingsService.create(req.user.id, dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Request() req,
    @Body() dto: UpdateListingDto,
  ) {
    return this.listingsService.update(id, req.user.id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.listingsService.remove(id, req.user.id);
  }

  @Post(':id/images')
  @UseGuards(JwtAuthGuard)
  addImage(
    @Param('id', ParseIntPipe) id: number,
    @Request() req,
    @Body() dto: AddImageDto,
  ) {
    return this.listingsService.addImage(id, req.user.id, dto);
  }

  @Delete('images/:imageId')
  @UseGuards(JwtAuthGuard)
  removeImage(@Param('imageId', ParseIntPipe) imageId: number, @Request() req) {
    return this.listingsService.removeImage(imageId, req.user.id);
  }

  @Get(':id/price-history')
  getPriceHistory(@Param('id', ParseIntPipe) id: number) {
    return this.listingsService.getPriceHistory(id);
  }
}
