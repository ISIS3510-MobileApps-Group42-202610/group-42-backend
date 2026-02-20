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
import { UsersService } from './users.service';
import {
  CreateBuyerDto,
  CreateSellerDto,
  UpdateBuyerDto,
  UpdateSellerDto,
  BuyerResponseDto,
  SellerResponseDto,
} from './dtos/user.dto';

@Controller('api/users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // Buyer endpoints
  @Post('buyers')
  @HttpCode(HttpStatus.CREATED)
  async createBuyer(@Body() createBuyerDto: CreateBuyerDto): Promise<BuyerResponseDto> {
    const buyer = await this.usersService.createBuyer(createBuyerDto);
    return this.mapBuyerToDto(buyer);
  }

  @Get('buyers')
  async getAllBuyers(
    @Query('skip') skip: number = 0,
    @Query('take') take: number = 10,
  ): Promise<{ data: BuyerResponseDto[]; total: number }> {
    const [buyers, total] = await this.usersService.getAllBuyers(skip, take);
    return {
      data: buyers.map((buyer) => this.mapBuyerToDto(buyer)),
      total,
    };
  }

  @Get('buyers/:id')
  async getBuyerById(@Param('id') id: string): Promise<BuyerResponseDto> {
    const buyer = await this.usersService.getBuyerById(id);
    return this.mapBuyerToDto(buyer);
  }

  @Patch('buyers/:id')
  async updateBuyer(
    @Param('id') id: string,
    @Body() updateBuyerDto: UpdateBuyerDto,
  ): Promise<BuyerResponseDto> {
    const buyer = await this.usersService.updateBuyer(id, updateBuyerDto);
    return this.mapBuyerToDto(buyer);
  }

  @Delete('buyers/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteBuyer(@Param('id') id: string): Promise<void> {
    await this.usersService.deleteBuyer(id);
  }

  // Seller endpoints
  @Post('sellers')
  @HttpCode(HttpStatus.CREATED)
  async createSeller(@Body() createSellerDto: CreateSellerDto): Promise<SellerResponseDto> {
    const seller = await this.usersService.createSeller(createSellerDto);
    return this.mapSellerToDto(seller);
  }

  @Get('sellers')
  async getAllSellers(
    @Query('skip') skip: number = 0,
    @Query('take') take: number = 10,
  ): Promise<{ data: SellerResponseDto[]; total: number }> {
    const [sellers, total] = await this.usersService.getAllSellers(skip, take);
    return {
      data: sellers.map((seller) => this.mapSellerToDto(seller)),
      total,
    };
  }

  @Get('sellers/:id')
  async getSellerById(@Param('id') id: string): Promise<SellerResponseDto> {
    const seller = await this.usersService.getSellerById(id);
    return this.mapSellerToDto(seller);
  }

  @Patch('sellers/:id')
  async updateSeller(
    @Param('id') id: string,
    @Body() updateSellerDto: UpdateSellerDto,
  ): Promise<SellerResponseDto> {
    const seller = await this.usersService.updateSeller(id, updateSellerDto);
    return this.mapSellerToDto(seller);
  }

  @Delete('sellers/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteSeller(@Param('id') id: string): Promise<void> {
    await this.usersService.deleteSeller(id);
  }

  // Helper methods to map entities to DTOs
  private mapBuyerToDto(buyer: any): BuyerResponseDto {
    const { passwordHash, ...dto } = buyer;
    return dto;
  }

  private mapSellerToDto(seller: any): SellerResponseDto {
    const { passwordHash, ...dto } = seller;
    return dto;
  }
}
