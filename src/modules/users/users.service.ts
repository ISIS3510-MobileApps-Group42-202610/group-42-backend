import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, Buyer, Seller } from './entities/user.entity';
import { CreateBuyerDto, CreateSellerDto, UpdateBuyerDto, UpdateSellerDto } from './dtos/user.dto';
import { UserType } from '../../common/enums';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Buyer)
    private readonly buyerRepository: Repository<Buyer>,
    @InjectRepository(Seller)
    private readonly sellerRepository: Repository<Seller>,
  ) {}

  async createBuyer(createBuyerDto: CreateBuyerDto): Promise<Buyer> {
    const { universityEmail, password, ...restData } = createBuyerDto;

    // Check if email already exists
    const existingUser = await this.userRepository.findOne({
      where: { universityEmail },
    });

    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create buyer
    const buyer = this.buyerRepository.create({
      userType: UserType.BUYER,
      universityEmail,
      passwordHash,
      ...restData,
    });

    return this.buyerRepository.save(buyer);
  }

  async createSeller(createSellerDto: CreateSellerDto): Promise<Seller> {
    const { universityEmail, password, ...restData } = createSellerDto;

    // Check if email already exists
    const existingUser = await this.userRepository.findOne({
      where: { universityEmail },
    });

    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create seller
    const seller = this.sellerRepository.create({
      userType: UserType.SELLER,
      universityEmail,
      passwordHash,
      ...restData,
    });

    return this.sellerRepository.save(seller);
  }

  async getBuyerById(id: string): Promise<Buyer> {
    const buyer = await this.buyerRepository.findOne({ where: { id } });
    if (!buyer) {
      throw new NotFoundException(`Buyer with ID ${id} not found`);
    }
    return buyer;
  }

  async getSellerById(id: string): Promise<Seller> {
    const seller = await this.sellerRepository.findOne({
      where: { id },
    });
    if (!seller) {
      throw new NotFoundException(`Seller with ID ${id} not found`);
    }
    return seller;
  }

  async getUserById(id: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  async getUserByEmail(email: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { universityEmail: email },
    });
    if (!user) {
      throw new NotFoundException(`User with email ${email} not found`);
    }
    return user;
  }

  async validatePassword(user: User, password: string): Promise<boolean> {
    return bcrypt.compare(password, user.passwordHash);
  }

  async getAllBuyers(skip: number = 0, take: number = 10): Promise<[Buyer[], number]> {
    return this.buyerRepository.findAndCount({
      skip,
      take,
      order: { createdAt: 'DESC' },
    });
  }

  async getAllSellers(skip: number = 0, take: number = 10): Promise<[Seller[], number]> {
    return this.sellerRepository.findAndCount({
      skip,
      take,
      order: { createdAt: 'DESC' },
    });
  }

  async updateBuyer(id: string, updateBuyerDto: UpdateBuyerDto): Promise<Buyer> {
    const buyer = await this.getBuyerById(id);
    Object.assign(buyer, updateBuyerDto);
    return this.buyerRepository.save(buyer);
  }

  async updateSeller(id: string, updateSellerDto: UpdateSellerDto): Promise<Seller> {
    const seller = await this.getSellerById(id);
    Object.assign(seller, updateSellerDto);
    return this.sellerRepository.save(seller);
  }

  async deleteBuyer(id: string): Promise<void> {
    const result = await this.buyerRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Buyer with ID ${id} not found`);
    }
  }

  async deleteSeller(id: string): Promise<void> {
    const result = await this.sellerRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Seller with ID ${id} not found`);
    }
  }

  async updateBuyerRating(buyerId: string, newRating: number): Promise<void> {
    // This would typically involve calculating average from reviews
    const buyer = await this.getBuyerById(buyerId);
    buyer.averageBuyerRating = newRating;
    await this.buyerRepository.save(buyer);
  }

  async updateSellerRating(sellerId: string, newRating: number): Promise<void> {
    const seller = await this.getSellerById(sellerId);
    seller.averageSellerRating = newRating;
    await this.sellerRepository.save(seller);
  }

  async incrementSellerTotalSales(sellerId: string): Promise<void> {
    await this.sellerRepository.increment({ id: sellerId }, 'totalSales', 1);
  }

  async incrementBuyerTotalPurchases(buyerId: string): Promise<void> {
    await this.buyerRepository.increment({ id: buyerId }, 'totalPurchases', 1);
  }
}
