# UniMarket Backend

A production-ready NestJS backend for a university student marketplace application. This is a complete implementation featuring users (Buyer/Seller), listings, transactions, messaging, reviews, and price analytics.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm/yarn
- PostgreSQL 12+
- Git

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd group-42-backend

# Install dependencies
npm install

# Create .env file from example
cp .env.example .env

# Update DATABASE_URL in .env
# DATABASE_URL=postgresql://user:password@localhost:5432/unimarket

# Run in development
npm run start:dev
```

Your API is now running at `http://localhost:3000`

## 📚 Documentation

This project includes comprehensive documentation:

### 1. **[SETUP_GUIDE.md](./SETUP_GUIDE.md)** - Start here!
   - Complete installation instructions
   - Environment configuration
   - Database setup
   - Development workflow
   - Troubleshooting guide
   - Deployment instructions

### 2. **[API_DOCUMENTATION.md](./API_DOCUMENTATION.md)** - API Reference
   - All 59 endpoints documented
   - Request/response examples
   - Data models and relationships
   - Error handling
   - Query parameters and filters

### 3. **[IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md)** - Technical Details
   - Architecture overview
   - Entity relationships
   - Feature modules breakdown
   - Business logic highlights
   - Security features
   - Best practices implemented

### 4. **.env.example** - Configuration template
   - All environment variables
   - Cloud provider examples
   - Comments for each setting

## ✨ Features

### Core Functionality
- ✅ **User Management** - Buyer and Seller accounts with Single Table Inheritance
- ✅ **Listings** - Create, manage, search university items for sale
- ✅ **Transactions** - Handle purchases with status tracking
- ✅ **Direct Messaging** - Chat between buyers and sellers
- ✅ **Reviews & Ratings** - Bidirectional review system
- ✅ **Course Integration** - Link listings to university courses
- ✅ **Price Analytics** - Track pricing trends and demand

### Technical Features
- ✅ **TypeORM** with PostgreSQL
- ✅ **UUID Primary Keys** for security
- ✅ **Single Table Inheritance** for User types
- ✅ **Environment-based Configuration** via ConfigService
- ✅ **Global Exception Handling** with standardized responses
- ✅ **Input Validation** on all DTOs
- ✅ **Password Hashing** with bcrypt
- ✅ **CORS Support** for web clients
- ✅ **RESTful API Design** with pagination
- ✅ **Modular Architecture** with 7 feature modules

## 📊 Architecture

```
src/
├── common/               # Shared utilities
│   ├── enums/           # All enumeration types
│   └── filters/         # Global exception filter
├── modules/             # 7 Feature modules
│   ├── users/           # User management
│   ├── listings/        # Product listings
│   ├── transactions/    # Purchase transactions
│   ├── messages/        # Direct messaging
│   ├── reviews/         # Rating system
│   ├── courses/         # University courses
│   └── price-history/   # Price analytics
├── app.module.ts        # Root module
├── main.ts              # Application entry point
└── ...
```

## 🗄️ Database

**8 Tables with proper relationships:**
- `users` - Base user table (Single Table Inheritance)
- `listings` - Product listings
- `listing_images` - Listing photos
- `transactions` - Purchase records
- `messages` - Direct messages
- `reviews` - Ratings and reviews
- `courses` - University courses
- `price_histories` - Price analytics
- Additional junction table for many-to-many relationships

## 🔧 Available Commands

```bash
# Development
npm run start:dev      # Run with auto-reload
npm run start:debug    # Run in debug mode

# Production
npm run build          # Build for production
npm run start:prod     # Run production build

# Code Quality
npm run format         # Format code with Prettier
npm run lint          # Lint with ESLint

# Testing
npm test              # Run unit tests
npm run test:watch    # Run tests in watch mode
npm run test:cov      # Generate coverage report
npm run test:e2e      # Run E2E tests
```

## 📝 Example API Calls

### Create a Buyer Account
```bash
curl -X POST http://localhost:3000/api/users/buyers \
  -H "Content-Type: application/json" \
  -d '{
    "universityEmail": "student@university.edu",
    "password": "SecurePassword123",
    "fullName": "John Doe",
    "faculty": "Engineering",
    "academicYear": "2024"
  }'
```

### Create a Listing
```bash
curl -X POST "http://localhost:3000/api/listings?sellerId=<seller-id>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Calculus Textbook",
    "description": "Used but in great condition",
    "category": "textbooks",
    "condition": "good",
    "originalPrice": 120,
    "sellingPrice": 75
  }'
```

### Search Listings
```bash
curl "http://localhost:3000/api/listings/search?category=textbooks&maxPrice=100&skip=0&take=10"
```

See [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) for all 59 endpoints.

## 🔒 Security

- **Password Hashing**: Bcrypt with 10 salt rounds
- **UUID Keys**: Prevents ID enumeration attacks
- **SQL Injection Prevention**: TypeORM parameterized queries
- **Input Validation**: Class-validator on all DTOs
- **CORS**: Configurable per environment
- **Error Handling**: No sensitive information in responses

## 🌍 Environment Support

Works with any PostgreSQL provider:
- **Local**: PostgreSQL installation
- **Cloud**: Neon, AWS RDS, Azure Database, Heroku Postgres
- **Docker**: With docker-compose


## 📈 Project Statistics

- **7** Feature Modules
- **8** Entities with proper relationships
- **32** DTOs with validation
- **59** RESTful endpoints
- **100%** TypeScript
- **Production-Ready** Code

## 🛠️ Technology Stack

| Layer | Technology |
|-------|-----------|
| Framework | NestJS 11.x |
| Language | TypeScript |
| Database | PostgreSQL |
| ORM | TypeORM 0.3.x |
| Validation | class-validator |
| Security | bcrypt, UUID |
| Config | @nestjs/config |

## 📚 Learning Resources

- [NestJS Documentation](https://docs.nestjs.com)
- [TypeORM Documentation](https://typeorm.io)
- [PostgreSQL Documentation](https://www.postgresql.org/docs)

## 🤝 Contributing

1. Create a feature branch: `git checkout -b feature/your-feature`
2. Make changes and test
3. Format code: `npm run format`
4. Lint code: `npm run lint`
5. Commit: `git commit -am 'Add your feature'`
6. Push: `git push origin feature/your-feature`
7. Create Pull Request

## 📄 License

UNLICENSED





$ npm install
```

## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Run tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ npm install -g @nestjs/mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
