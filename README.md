# 🛒 University Marketplace API

A NestJS REST API for a university marketplace — buy/sell textbooks, notes, and supplies. Built with TypeORM + PostgreSQL + Bcrypt + JWT.

---

## 📐 Architecture

```
src/
├── auth/           # JWT authentication (register/login, bcrypt hashing)
├── users/          # User profiles, wishlist, purchase history
├── sellers/        # Seller profiles (auto-created on register)
├── listings/       # Product listings, images, price history
├── transactions/   # Purchase flow
├── reviews/        # Post-purchase reviews (updates seller avg_rating)
├── messages/       # Bidirectional Buyer ↔ Seller chat
└── courses/        # Course catalog (linked to listings)
```

---

## 🚀 Quick Start

### 1. Install dependencies
```bash
npm install
```

### 2. Configure environment
```bash
cp .env.example .env
# Edit .env with your PostgreSQL credentials and JWT secret
```

### 3. Run (dev — auto-syncs DB schema)
```bash
npm run start:dev
```

### 4. Production
```bash
npm run build
npm run start:prod
```

> **Note:** `synchronize: true` is enabled in development. For production, set `NODE_ENV=production` and use TypeORM migrations.

---

## 🔐 Authentication

All protected routes require: `Authorization: Bearer <token>`

---

## 📡 API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/register` | Register a new user |
| POST | `/api/v1/auth/login` | Login and get JWT |

**Register body:**
```json
{
  "name": "Juan",
  "last_name": "García",
  "email": "juan@uni.edu",
  "password": "secret123",
  "semester": 4,
  "is_seller": true
}
```

---

### Users 🔒
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/users` | List all users |
| GET | `/api/v1/users/me` | Get own profile |
| PATCH | `/api/v1/users/me` | Update own profile |
| GET | `/api/v1/users/me/wishlist` | Get wishlist |
| POST | `/api/v1/users/me/wishlist/:listingId` | Add to wishlist |
| DELETE | `/api/v1/users/me/wishlist/:listingId` | Remove from wishlist |
| GET | `/api/v1/users/me/purchases` | Purchase history |
| GET | `/api/v1/users/:id` | Get user by ID |

---

### Sellers
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/sellers` | List all sellers |
| GET | `/api/v1/sellers/me` 🔒 | Get own seller profile |
| GET | `/api/v1/sellers/:id` | Get seller by ID |

---

### Listings
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/listings` | Browse listings (filter: `?category=&condition=`) |
| GET | `/api/v1/listings/:id` | Get listing detail |
| POST | `/api/v1/listings` 🔒 | Create listing (sellers only) |
| PATCH | `/api/v1/listings/:id` 🔒 | Update listing |
| DELETE | `/api/v1/listings/:id` 🔒 | Delete listing |
| POST | `/api/v1/listings/:id/images` 🔒 | Add image |
| DELETE | `/api/v1/listings/images/:imageId` 🔒 | Remove image |
| GET | `/api/v1/listings/:id/price-history` | Price history |

**Create listing body:**
```json
{
  "title": "Calculus Stewart 8th Edition",
  "product": "Textbook",
  "category": "textbook",
  "condition": "good",
  "original_price": 120000,
  "selling_price": 65000,
  "course_id": 1
}
```

**Categories:** `textbook | notes | supplies | electronics | other`
**Conditions:** `new | like_new | good | fair | poor`

---

### Transactions 🔒
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/transactions` | Purchase a listing |
| GET | `/api/v1/transactions/my` | My purchases |
| GET | `/api/v1/transactions/my-sales` | My sales (sellers only) |
| GET | `/api/v1/transactions/:id` | Transaction detail |

**Purchase body:**
```json
{ "listing_id": 5 }
```

> Purchasing a listing automatically marks it as `active: false` and increments the seller's `total_sales`.

---

### Reviews 🔒
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/reviews/transaction/:id` | Leave a review |
| GET | `/api/v1/reviews/transaction/:id` | Get review for a transaction |

**Review body:**
```json
{ "content": "Great seller, fast response!", "rating": 5 }
```

> Reviews automatically recalculate and update the seller's `avg_rating`.

---

### Messages 🔒

Both buyers and sellers can initiate and reply to conversations. Every message stores a `sent_by` field (`buyer` or `seller`) so both clients always know who wrote each message.

**Sending**

| Method | Endpoint | Who uses it | Description |
|--------|----------|-------------|-------------|
| POST | `/api/v1/messages/buyer` | Buyer | Send a message to a seller |
| POST | `/api/v1/messages/seller` | Seller | Send a message to a buyer |

Buyer send body:
```json
{ "seller_id": 2, "content": "Is this still available?" }
```

Seller send body:
```json
{ "buyer_id": 10, "content": "Yes, still available! Interested?" }
```

**Conversation lists**

| Method | Endpoint | Who uses it | Description |
|--------|----------|-------------|-------------|
| GET | `/api/v1/messages/as-buyer` | Buyer | All threads where I am the buyer |
| GET | `/api/v1/messages/as-seller` | Seller | All threads where I am the seller |

**Thread views**

| Method | Endpoint | Who uses it | Description |
|--------|----------|-------------|-------------|
| GET | `/api/v1/messages/thread/seller/:sellerId` | Buyer | Full thread with a specific seller |
| GET | `/api/v1/messages/thread/buyer/:buyerId` | Seller | Full thread with a specific buyer |

**Mark as read**

| Method | Endpoint | Description |
|--------|----------|-------------|
| PATCH | `/api/v1/messages/:id/read` | Mark a received message as read |

> Each party can only mark messages sent **by the other party** as read. Attempting to mark your own message as read returns `403 Forbidden`.

**`sent_by` enum values:** `buyer` | `seller`

---

### Courses
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/courses` | List all courses |
| GET | `/api/v1/courses/:id` | Get course by ID |
| POST | `/api/v1/courses` 🔒 | Create a course |
| DELETE | `/api/v1/courses/:id` 🔒 | Delete a course |

---

## 🗄️ Database Schema Summary

| Table | Key Relations |
|-------|--------------|
| `users` | One → One `sellers`, Many ↔ Many `listings` (wishlist) |
| `sellers` | One `user`, Many `listings`, Many `transactions` |
| `listings` | Belongs to `seller`, optional `course`, has `listing_images`, `historic_prices` |
| `transactions` | Buyer (`user`) + Seller + Listing → One `review` |
| `reviews` | Belongs to one `transaction` |
| `messages` | Between `buyer` (user) and `seller` — `sent_by` enum tracks direction of each message |
| `historic_prices` | Tracks price changes per listing over time |
| `courses` | Referenced by `listings` |

---

## 🧪 Testing

```bash
# Run all tests
npm run test

# Run with coverage report
npm run test:cov
```

Tests use fully mocked repositories — no database connection required. Coverage spans all 7 services: Auth, Users, Sellers, Listings, Transactions, Reviews, Messages.

CI runs automatically on every push and pull request via GitHub Actions (`.github/workflows/ci.yml`).

---

## 🔧 Tech Stack

- **Framework:** NestJS 10
- **ORM:** TypeORM 0.3 (PostgreSQL)
- **Auth:** JWT (passport-jwt) + Bcrypt password hashing
- **Validation:** class-validator + class-transformer
- **Testing:** Jest + ts-jest
- **CI:** GitHub Actions