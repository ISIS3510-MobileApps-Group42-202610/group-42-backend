import { config } from 'dotenv';
import { faker } from '@faker-js/faker';
import * as bcrypt from 'bcrypt';
import { DataSource, Repository } from 'typeorm';
import { User } from './users/user.entity';
import { Seller } from './sellers/seller.entity';
import {
  Listing,
  ListingCategory,
  ListingCondition,
} from './listings/listing.entity';
import { Course } from './courses/course.entity';
import { Message, SentBy } from './messages/message.entity';
import { Transaction } from './transactions/transaction.entity';
import { Review } from './reviews/review.entity';

config();

const appDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  ssl: {
	rejectUnauthorized: false,
  },
  entities: ['src/**/*.entity.ts'],
  synchronize: false,
});

type SeederConfig = {
  buyers: number;
  sellers: number;
  listingsPerSeller: number;
  messages: number;
  transactions: number;
  reviews: number;
};

function getNumberArg(name: string, fallback: number): number {
  const arg = process.argv.find((item) => item.startsWith(`--${name}=`));
  if (!arg) {
	return fallback;
  }

  const parsed = Number.parseInt(arg.split('=')[1], 10);
  if (Number.isNaN(parsed) || parsed < 0) {
	throw new Error(`Invalid value for --${name}. Expected a non-negative integer.`);
  }

  return parsed;
}

function buildConfig(): SeederConfig {
  return {
	buyers: getNumberArg('buyers', 10),
	sellers: getNumberArg('sellers', 5),
	listingsPerSeller: getNumberArg('listings-per-seller', 3),
	messages: getNumberArg('messages', 20),
	transactions: getNumberArg('transactions', 6),
	reviews: getNumberArg('reviews', 4),
  };
}

async function ensureCourses(courseRepository: Repository<Course>) {
  const existingCourses = await courseRepository.find();
  if (existingCourses.length > 0) {
	return existingCourses;
  }

  const year = new Date().getFullYear();
  const fallbackCourses = [
	{ code: `SEED-${year}-CALC`, name: 'Calculo Diferencial', faculty: 'Engineering' },
	{ code: `SEED-${year}-PROG`, name: 'Programacion Avanzada', faculty: 'Engineering' },
	{ code: `SEED-${year}-MICR`, name: 'Microeconomia', faculty: 'Economics' },
  ];

  await courseRepository
	.createQueryBuilder()
	.insert()
	.into(Course)
	.values(fallbackCourses)
	.orIgnore()
	.execute();

  return courseRepository.find();
}

async function seedMarketplaceData(configValues: SeederConfig) {
  await appDataSource.initialize();

  const userRepository = appDataSource.getRepository(User);
  const sellerRepository = appDataSource.getRepository(Seller);
  const listingRepository = appDataSource.getRepository(Listing);
  const courseRepository = appDataSource.getRepository(Course);
  const messageRepository = appDataSource.getRepository(Message);
  const transactionRepository = appDataSource.getRepository(Transaction);
  const reviewRepository = appDataSource.getRepository(Review);

  const batchTag = Date.now();
  const defaultPasswordHash = await bcrypt.hash('seed1234', 10);

  try {
	const courses = await ensureCourses(courseRepository);
	const sellerUsers = await userRepository.save(
	  Array.from({ length: configValues.sellers }, (_, index) =>
		userRepository.create({
		  name: faker.person.firstName(),
		  last_name: faker.person.lastName(),
		  email: `seed-seller-${batchTag}-${index}@unimarket.dev`,
		  passwordHash: defaultPasswordHash,
		  semester: faker.number.int({ min: 1, max: 10 }),
		  is_seller: true,
		  profile_pic: faker.image.avatar(),
		}),
	  ),
	);

	const sellers = await sellerRepository.save(
	  sellerUsers.map((user) =>
		sellerRepository.create({
		  user_id: user.id,
		  total_sales: 0,
		  avg_rating: 0,
		}),
	  ),
	);

	const buyers = await userRepository.save(
	  Array.from({ length: configValues.buyers }, (_, index) =>
		userRepository.create({
		  name: faker.person.firstName(),
		  last_name: faker.person.lastName(),
		  email: `seed-buyer-${batchTag}-${index}@unimarket.dev`,
		  passwordHash: defaultPasswordHash,
		  semester: faker.number.int({ min: 1, max: 10 }),
		  is_seller: false,
		  profile_pic: faker.image.avatar(),
		}),
	  ),
	);

	const createdListings = await listingRepository.save(
	  sellers.flatMap((seller) =>
		Array.from({ length: configValues.listingsPerSeller }, () => {
		  const category = faker.helpers.arrayElement(Object.values(ListingCategory));
		  const basePrice = faker.number.int({ min: 20000, max: 250000 });
		  const discount = faker.number.int({ min: 1000, max: 20000 });

		  return listingRepository.create({
			seller_id: seller.id,
			course_id: faker.helpers.arrayElement(courses).id,
			title: faker.commerce.productName(),
			product: faker.commerce.productMaterial(),
			category,
			condition: faker.helpers.arrayElement(Object.values(ListingCondition)),
			original_price: basePrice,
			selling_price: Math.max(5000, basePrice - discount),
			active: true,
		  });
		}),
	  ),
	);

	const createdMessages = await messageRepository.save(
	  Array.from({ length: configValues.messages }, () => {
		const seller = faker.helpers.arrayElement(sellers);
		const buyer = faker.helpers.arrayElement(buyers);

		return messageRepository.create({
		  seller_id: seller.id,
		  buyer_id: buyer.id,
		  content: faker.lorem.sentence(),
		  sent_by: faker.helpers.arrayElement([SentBy.BUYER, SentBy.SELLER]),
		  is_read: faker.datatype.boolean(),
		});
	  }),
	);

	const transactionLimit = Math.min(configValues.transactions, createdListings.length);
	const createdTransactions: Transaction[] = [];

	for (let index = 0; index < transactionLimit; index++) {
	  const listing = createdListings[index];
	  const seller = sellers.find((item) => item.id === listing.seller_id);
	  if (!seller) {
		continue;
	  }

	  const sellerUserId = seller.user_id;
	  const eligibleBuyers = buyers.filter((buyer) => buyer.id !== sellerUserId);
	  if (eligibleBuyers.length === 0) {
		continue;
	  }

	  const chosenBuyer = faker.helpers.arrayElement(eligibleBuyers);

	  listing.buyer_id = chosenBuyer.id;
	  listing.active = false;
	  await listingRepository.save(listing);

	  seller.total_sales += 1;
	  await sellerRepository.save(seller);

	  const transaction = await transactionRepository.save(
		transactionRepository.create({
		  buyer_id: chosenBuyer.id,
		  seller_id: seller.id,
		  listing_id: listing.id,
		  amount: listing.selling_price,
		}),
	  );

	  createdTransactions.push(transaction);
	}

	const reviewLimit = Math.min(configValues.reviews, createdTransactions.length);
	const createdReviews = await reviewRepository.save(
	  createdTransactions.slice(0, reviewLimit).map((transaction) =>
		reviewRepository.create({
		  transaction_id: transaction.id,
		  content: `${faker.lorem.sentence()} ${faker.lorem.sentence()}`,
		  rating: faker.number.int({ min: 3, max: 5 }),
		}),
	  ),
	);

	console.log(`Seeder completed without deleting existing rows.`);
	console.log(`Added users: ${sellerUsers.length + buyers.length}`);
	console.log(`Added sellers: ${sellers.length}`);
	console.log(`Added listings: ${createdListings.length}`);
	console.log(`Added messages: ${createdMessages.length}`);
	console.log(`Added transactions: ${createdTransactions.length}`);
	console.log(`Added reviews: ${createdReviews.length}`);
  } finally {
	await appDataSource.destroy();
  }
}

const configValues = buildConfig();
seedMarketplaceData(configValues).catch((error) => {
  console.error('Error running marketplace seeder:', error.message);
  process.exit(1);
});


