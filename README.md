# 🛒 University Marketplace API

A NestJS REST API for a university marketplace — buy/sell textbooks, notes, and supplies. Built with TypeORM + PostgreSQL + Bcrypt + JWT.

---

## 📐 Architecture

```
src/
├── auth/           # JWT auth, password recovery, account deletion
├── users/          # User profiles, wishlist, following, purchase history
├── sellers/        # Seller profiles (auto-created on register)
├── listings/       # Product listings, home feed, images, price history
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

### 5. Seed Uniandes course catalog (2026)
```bash
npm run seed:courses
```

Optional custom CSV path:
```bash
npm run seed:courses -- ./my-catalog.csv
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
| POST | `/api/v1/auth/forgot-password` | Send a password reset code to email |
| POST | `/api/v1/auth/reset-password` | Reset password using the emailed code |
| DELETE | `/api/v1/auth/account` 🔒 | Delete the authenticated account |

### Uploads
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/uploads/cloudinary-signature` | Generate a Cloudinary signed-upload signature |

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

**Login body:**
```json
{
  "email": "juan@uni.edu",
  "password": "secret123"
}
```

**Forgot password body:**
```json
{
  "email": "juan@uni.edu"
}
```

**Reset password body:**
```json
{
  "token": "ABCD2345",
  "new_password": "newSecret123"
}
```

**Delete account body:**
```json
{
  "password": "secret123"
}
```

> `forgot-password` always returns a generic success message to avoid revealing whether an email is registered.

---

### Users 🔒
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/users` | List all users |
| GET | `/api/v1/users/me` | Get own profile |
| PATCH | `/api/v1/users/me` | Update own profile |
| GET | `/api/v1/users/me/wishlist` | Get wishlist |
| POST | `/api/v1/users/me/wishlist/:listingId` | Add to wishlist |
| POST | `/api/v1/users/me/follow/:userId` | Follow another user |
| DELETE | `/api/v1/users/me/wishlist/:listingId` | Remove from wishlist |
| GET | `/api/v1/users/me/purchases` | Purchase history |
| GET | `/api/v1/users/:id` | Get user by ID |
| DELETE | `/api/v1/users/:id` | Delete a user by ID |

**Update profile body (example):**
```json
{
  "name": "Juan David",
  "last_name": "García",
  "semester": 5,
  "profile_pic": "https://example.com/avatar.jpg"
}
```

**Follow usage:**

`POST /api/v1/users/me/follow/12`

> You cannot follow yourself. Repeating the same follow request is safe and keeps the relation once.

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
| GET | `/api/v1/listings/home/ranking` | Home feed with recent, trending, and category ranking data |
| GET | `/api/v1/listings/my` 🔒 | Get my listings grouped into `active` and `sold` |
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

**Update listing body (example):**
```json
{
  "selling_price": 60000,
  "condition": "like_new",
  "active": true
}
```

**Add image body:**
```json
{
  "url": "https://example.com/listings/calculus-cover.jpg",
  "is_primary": true
}
```

**Home feed usage:**

`GET /api/v1/listings/home/ranking`

Returns:
- `recent`: latest active listings
- `trending`: active listings ordered by marketplace activity score
- `categories`: active listing counts grouped by category

> `GET /api/v1/listings/my` requires auth and returns `{ active: Listing[], sold: Listing[] }` for the current seller.

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

**Create course body:**
```json
{
  "code": "MAT101",
  "name": "Cálculo Diferencial",
  "faculty": "Engineering"
}
```

---

## 🗄️ Database Schema Summary

| Table | Key Relations |
|-------|--------------|
| `users` | One → One `sellers`, Many ↔ Many `listings` (wishlist), Many ↔ Many `users` (following) |
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

Tests use fully mocked repositories — no database connection required. Coverage spans Auth, Users, Sellers, Listings, Transactions, Reviews, Messages, and Courses modules/services.

CI runs automatically on every push and pull request via GitHub Actions (`.github/workflows/ci.yml`).

---

## 🔧 Tech Stack

- **Framework:** NestJS 11
- **ORM:** TypeORM 0.3 (PostgreSQL)
- **Auth:** JWT (passport-jwt) + Bcrypt password hashing
- **Validation:** class-validator + class-transformer
- **Testing:** Jest + ts-jest
- **CI:** GitHub Actions

---

## ☁️ Cloudinary Signed Uploads (Mini Guide)

### 1. Configure variables

Create `.env` from `.env.example` and set real values:

```bash
cp .env.example .env
```

Required variables:

- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `CLOUDINARY_UPLOAD_FOLDER` (optional, default folder for signed uploads)

Alternative (also supported):

- `CLOUDINARY_URL=cloudinary://<api_key>:<api_secret>@<cloud_name>`

### 2. Run backend

```bash
npm install
npm run start:dev
```

### 3. Test signature endpoint with curl

This route must keep this exact path for frontend compatibility:

- `POST /api/v1/uploads/cloudinary-signature`

Example:

```bash
curl -X POST "http://localhost:3000/api/v1/uploads/cloudinary-signature" \
  -H "Content-Type: application/json" \
  -d '{"folder":"unimarket/listings","public_id":"listing_123"}'
```

Expected response shape:

```json
{
  "cloudName": "...",
  "cloud_name": "...",
  "apiKey": "...",
  "api_key": "...",
  "timestamp": "1710000000",
  "signature": "...",
  "folder": "unimarket/listings"
}
```