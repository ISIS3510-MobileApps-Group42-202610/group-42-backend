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
├── messages/       # Buyer ↔ Seller chat
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

| Method | Endpoint             | Description         |
| ------ | -------------------- | ------------------- |
| POST   | `/api/auth/register` | Register a new user |
| POST   | `/api/auth/login`    | Login and get JWT   |

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

| Method | Endpoint                            | Description          |
| ------ | ----------------------------------- | -------------------- |
| GET    | `/api/users`                        | List all users       |
| GET    | `/api/users/me`                     | Get own profile      |
| PATCH  | `/api/users/me`                     | Update own profile   |
| GET    | `/api/users/me/wishlist`            | Get wishlist         |
| POST   | `/api/users/me/wishlist/:listingId` | Add to wishlist      |
| DELETE | `/api/users/me/wishlist/:listingId` | Remove from wishlist |
| GET    | `/api/users/me/purchases`           | Purchase history     |
| GET    | `/api/users/:id`                    | Get user by ID       |

---

### Sellers

| Method | Endpoint             | Description            |
| ------ | -------------------- | ---------------------- |
| GET    | `/api/sellers`       | List all sellers       |
| GET    | `/api/sellers/me` 🔒 | Get own seller profile |
| GET    | `/api/sellers/:id`   | Get seller by ID       |

---

### Listings

| Method | Endpoint                           | Description                                       |
| ------ | ---------------------------------- | ------------------------------------------------- |
| GET    | `/api/listings`                    | Browse listings (filter: `?category=&condition=`) |
| GET    | `/api/listings/:id`                | Get listing detail                                |
| POST   | `/api/listings` 🔒                 | Create listing (sellers only)                     |
| PATCH  | `/api/listings/:id` 🔒             | Update listing                                    |
| DELETE | `/api/listings/:id` 🔒             | Delete listing                                    |
| POST   | `/api/listings/:id/images` 🔒      | Add image                                         |
| DELETE | `/api/listings/images/:imageId` 🔒 | Remove image                                      |
| GET    | `/api/listings/:id/price-history`  | Price history                                     |

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

| Method | Endpoint                     | Description        |
| ------ | ---------------------------- | ------------------ |
| POST   | `/api/transactions`          | Purchase a listing |
| GET    | `/api/transactions/my`       | My purchases       |
| GET    | `/api/transactions/my-sales` | My sales (sellers) |
| GET    | `/api/transactions/:id`      | Transaction detail |

**Purchase body:**

```json
{ "listing_id": 5 }
```

> Purchasing a listing automatically marks it as `active: false` and increments the seller's `total_sales`.

---

### Reviews 🔒

| Method | Endpoint                       | Description    |
| ------ | ------------------------------ | -------------- |
| POST   | `/api/reviews/transaction/:id` | Leave a review |
| GET    | `/api/reviews/transaction/:id` | Get review     |

**Review body:**

```json
{ "content": "Great seller, fast response!", "rating": 5 }
```

> Reviews automatically update the seller's `avg_rating`.

---

### Messages 🔒

| Method | Endpoint                         | Description                |
| ------ | -------------------------------- | -------------------------- |
| POST   | `/api/messages`                  | Send a message to a seller |
| GET    | `/api/messages`                  | My conversations           |
| GET    | `/api/messages/seller/:sellerId` | Conversation with seller   |
| PATCH  | `/api/messages/:id/read`         | Mark as read (seller only) |

**Send message body:**

```json
{ "seller_id": 2, "content": "Is this still available?" }
```

---

### Courses

| Method | Endpoint              | Description      |
| ------ | --------------------- | ---------------- |
| GET    | `/api/courses`        | List all courses |
| GET    | `/api/courses/:id`    | Get course       |
| POST   | `/api/courses` 🔒     | Create course    |
| DELETE | `/api/courses/:id` 🔒 | Delete course    |

---

## 🗄️ Database Schema Summary

| Table             | Key Relations                                                                   |
| ----------------- | ------------------------------------------------------------------------------- |
| `users`           | One → One `sellers`, Many ↔ Many `listings` (wishlist)                          |
| `sellers`         | One `user`, Many `listings`, Many `transactions`                                |
| `listings`        | Belongs to `seller`, optional `course`, has `listing_images`, `historic_prices` |
| `transactions`    | Buyer (`user`) + Seller + Listing → One `review`                                |
| `reviews`         | Belongs to one `transaction`                                                    |
| `messages`        | Between `buyer` (user) and `seller`                                             |
| `historic_prices` | Tracks price changes per listing                                                |
| `courses`         | Referenced by `listings`                                                        |

---

## 🔧 Tech Stack

- **Framework:** NestJS 10
- **ORM:** TypeORM 0.3 (PostgreSQL)
- **Auth:** JWT (passport-jwt) + Bcrypt password hashing
- **Validation:** class-validator + class-transformer
