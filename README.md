# Room Management API - Full Documentation

> A RESTful API for managing rental properties — rooms, tenants, invoices, and payments — built with **FastAPI**, **SQLAlchemy**, **PostgreSQL**, and **APScheduler**.

---

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Environment Variables](#environment-variables)
  - [Database Setup](#database-setup)
  - [Install Dependencies](#install-dependencies)
  - [Run Migrations](#run-migrations)
  - [Seed the Database](#seed-the-database)
  - [Start the Server](#start-the-server)
- [Authentication](#authentication)
- [API Endpoints](#api-endpoints)
  - [Login](#login)
  - [Users](#users)
  - [Rooms](#rooms)
  - [Tenants](#tenants)
  - [Invoices](#invoices)
  - [Billing](#billing)
- [Data Models](#data-models)
- [Role-Based Access Control](#role-based-access-control)
- [Scheduled Jobs](#scheduled-jobs)
- [Error Handling](#error-handling)
- [File Uploads](#file-uploads)

---

## Overview

This API provides a complete system for managing rental properties. It supports:

- User management with role-based access (Admin, Staff, Tenant)
- Room CRUD operations with availability tracking
- Tenant management with check-in/check-out
- Automatic monthly invoice generation
- Payment tracking with proof-of-payment image uploads
- Late fee processing
- Monthly payment reports

**Base URL:** `http://localhost:8000/api/v1`

**Interactive Docs:**
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

---

## Tech Stack

| Layer            | Technology                     |
| ---------------- | ------------------------------ |
| Framework        | FastAPI 0.133                  |
| ORM              | SQLAlchemy 2.0                 |
| Database         | PostgreSQL 16                  |
| Migrations       | Alembic                        |
| Auth             | python-jose (JWT), argon2-cffi |
| Scheduler        | APScheduler 3.11               |
| Server           | Uvicorn                        |
| Containerization | Docker Compose                 |

---

## Project Structure

```
api/
├── docker-compose.yml          # PostgreSQL + pgAdmin containers
├── alembic.ini                 # Alembic config
├── alembic/versions/           # Migration files
├── requirements.txt
├── pyproject.toml
├── .env                        # Environment variables
└── src/
    ├── main.py                 # FastAPI app entry point
    └── app/
        ├── config/
        │   ├── base.py         # SQLAlchemy declarative base
        │   ├── config.py       # Environment settings
        │   ├── logger.py       # Logging setup
        │   ├── scheduler.py    # APScheduler setup
        │   └── session.py      # DB session factory
        ├── database/
        │   ├── index.py        # Seeder CLI entry point
        │   └── seed/           # Seeder classes
        ├── middleware/
        │   ├── jwt_service.py  # JWT encode/decode/verify
        │   └── guard/
        │       └── permission.py  # PermissionGuard
        ├── model/              # SQLAlchemy ORM models
        │   ├── user.py
        │   ├── role.py
        │   ├── room.py
        │   ├── tenant.py
        │   ├── invoice.py
        │   └── payment.py
        ├── routes/             # FastAPI routers
        │   ├── login.py
        │   ├── user.py
        │   ├── room.py
        │   ├── tenant.py
        │   ├── invoice.py
        │   └── billing.py
        ├── schema/             # Pydantic request/response schemas
        └── services/           # Business logic layer
```

---

## Getting Started

### Prerequisites

- Python 3.11+
- Docker & Docker Compose
- `pip` or `uv`

### Environment Variables

Create a `.env` file in the project root:

```env
DATABASE_URL=postgresql+psycopg2://postgres:admin2026@localhost:5432/db_room
SECRET_KEY=your_secret_key_here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
```

### Database Setup

Start PostgreSQL and pgAdmin with Docker Compose:

```bash
docker compose up -d
```

| Service  | URL                   | Credentials                     |
| -------- | --------------------- | ------------------------------- |
| Postgres | `localhost:5432`      | `postgres` / `admin2026`        |
| pgAdmin  | http://localhost:5050 | `admin@gmail.com` / `admin2026` |

### Install Dependencies

Using `uv`:
```bash
uv sync
```

Or using `pip`:
```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

### Run Migrations

```bash
# Initialize alembic (first time only)
rm -rf alembic/
alembic init alembic
alembic upgrade head

# After model changes
alembic revision --autogenerate -m "describe change"
alembic upgrade head
```

### Seed the Database

```bash
python -m src.app.database.index
```

**Options:**
```
--rooms N        Number of rooms (default: 20)
--tenants N      Number of tenants (default: 20)
--no-clear       Skip clearing existing data
--dry-run        Preview without executing
```

**Seeded Accounts:**

| Role  | Email             | Password |
| ----- | ----------------- | -------- |
| Admin | admin@example.com | admin123 |
| Staff | john@rental.com   | staff123 |
| Staff | emma@rental.com   | staff123 |
| Staff | mike@rental.com   | staff123 |

### Start the Server

```bash
uvicorn src.main:app --reload
```

---

## Authentication

All protected endpoints require a JWT Bearer token:

```
Authorization: Bearer <access_token>
```

### Token Payload

```json
{
  "sub": "<user_id>",
  "role": "<role_id>",
  "exp": "<expiry_timestamp>"
}
```

---

## API Endpoints

All endpoints are prefixed with `/api/v1`.

### Login

#### `POST /api/v1/login`

Authenticate and receive a JWT token.

**Request Body:**
```json
{
  "email": "admin@example.com",
  "password": "admin123"
}
```

**Response (200):**
```json
{
  "access_token": "<jwt_token>",
  "token_type": "bearer",
  "info": {
    "device": "...",
    "os": "...",
    "browser": "..."
  }
}
```

**Errors:**
- `401` - Invalid email or password

---

### Users

> **Access:** Admin only

| Method | Endpoint       | Description         |
| ------ | -------------- | ------------------- |
| POST   | `/users`       | Create a new user   |
| GET    | `/users`       | List all users      |
| GET    | `/users/{id}`  | Get user by ID      |
| GET    | `/users/setup-form` | Get setup form |
| PUT    | `/users/{id}`  | Update user         |
| DELETE | `/users/{id}`  | Delete user         |

#### `POST /users`

Create a new user (multipart form data).

**Form Fields:**
| Field     | Type   | Required |
| --------- | ------ | -------- |
| name      | string | Yes      |
| email     | string | Yes      |
| password  | string | Yes      |
| role_id   | int    | Yes      |
| image     | file   | No       |

**Response (201):**
```json
{
  "id": 1,
  "name": "John Doe",
  "email": "john@example.com",
  "role_id": 1,
  "image": "/uploads/profile.jpg",
  "role": {
    "id": 1,
    "name": "admin",
    "description": "Administrator"
  }
}
```

#### `GET /users`

List all users with pagination.

**Query Parameters:**
| Param | Type | Default | Description |
| ----- | ---- | ------- | ----------- |
| page  | int  | 1       | Page number |
| limit | int  | 10      | Items per page |

#### `GET /users/{id}`

Get a specific user by ID.

**Response (200):** UserResponse object

**Errors:**
- `404` - User not found

#### `PUT /users/{id}`

Update user (multipart form data).

**Form Fields:**
| Field     | Type   | Required |
| --------- | ------ | -------- |
| name      | string | No       |
| email     | string | No       |
| password  | string | No       |
| role_id   | int    | No       |
| image     | file   | No       |

**Errors:**
- `400` - Validation error

#### `DELETE /users/{id}`

Delete a user.

**Errors:**
- `404` - User not found

---

### Rooms

> **Access:** Admin and Staff

| Method | Endpoint                  | Description              |
| ------ | ------------------------- | ------------------------ |
| POST   | `/rooms`                  | Create a room            |
| GET    | `/rooms`                  | List all rooms           |
| GET    | `/rooms/{room_id}`        | Get room by ID           |
| PUT    | `/rooms/{room_id}`        | Update room              |
| DELETE | `/rooms/{room_id}`        | Delete room              |
| POST   | `/rooms/{room_id}/assign` | Assign tenant to room    |

#### `POST /rooms`

Create a new room.

**Request Body:**
```json
{
  "name": "Room 101",
  "description": "Single room with AC",
  "price": 500.00,
  "is_available": true
}
```

**Validation:**
- `name`: 1-255 characters
- `price`: must be > 0

**Errors:**
- `400` - Validation error
- `500` - Server error

#### `GET /rooms`

List all rooms with pagination and search.

**Query Parameters:**
| Param  | Type   | Default | Description     |
| ------ | ------ | ------- | --------------- |
| page   | int    | 1       | Page number     |
| limit  | int    | 100     | Items per page  |
| search | string | null    | Search term     |

#### `GET /rooms/{room_id}`

Get room details including tenant and payment info.

**Response (200):**
```json
{
  "id": 1,
  "name": "Room 101",
  "description": "Single room with AC",
  "price": 500.00,
  "is_available": false,
  "status": "occupied",
  "tenant": { ... },
  "payment_status": "paid",
  "amount_due": 0.0,
  "due_date": "2026-03-01",
  "latest_payment": { ... },
  "updated_at": "2026-03-15T10:00:00"
}
```

**Errors:**
- `404` - Room not found

#### `PUT /rooms/{room_id}`

Update room details.

**Request Body:** (all fields optional)
```json
{
  "name": "Room 101A",
  "price": 550.00,
  "is_available": true
}
```

**Errors:**
- `404` - Room not found

#### `DELETE /rooms/{room_id}`

Delete a room (only if available/vacant).

**Errors:**
- `400` - Room has tenant or other constraint

#### `POST /rooms/{room_id}/assign`

Assign a tenant to a room.

**Request Body:**
```json
{
  "tenant_id": 5
}
```

**Errors:**
- `400` - Room not available or tenant not found

---

### Tenants

> **Access:** Admin and Staff

| Method | Endpoint              | Description            |
| ------ | --------------------- | ---------------------- |
| POST   | `/tenants`            | Create a tenant        |
| GET    | `/tenants`            | List all tenants       |
| GET    | `/tenants/{tenant_id}`| Get tenant by ID       |
| DELETE | `/tenants/{tenant_id}`| Remove/check-out tenant|

#### `POST /tenants`

Create a new tenant.

**Request Body:**
```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "phone": "012-345-6789",
  "id_card": "1234567890"
}
```

**Validation:**
- `name`: 1-255 characters
- `phone`: max 50 characters
- `id_card`: max 100 characters

#### `GET /tenants`

List all tenants with pagination and search.

**Query Parameters:**
| Param  | Type   | Default | Description     |
| ------ | ------ | ------- | --------------- |
| page   | int    | 1       | Page number     |
| limit  | int    | 100     | Items per page  |
| search | string | null    | Search term     |

#### `GET /tenants/{tenant_id}`

Get tenant details.

**Errors:**
- `404` - Tenant not found

#### `DELETE /tenants/{tenant_id}`

Remove/check-out a tenant. Sets `is_active` to false and records check-out date.

**Errors:**
- `400` - Error during checkout

---

### Invoices

> **Access:** Varies by endpoint (see below)

| Method | Endpoint                                      | Description                    | Required Role        |
| ------ | --------------------------------------------- | ------------------------------ | -------------------- |
| GET    | `/invoices`                                   | List invoices (paginated)      | Admin, Staff, Tenant |
| GET    | `/invoices/{invoice_id}`                      | Get invoice by ID              | Admin, Staff, Tenant |
| POST   | `/invoices/generate`                          | Generate single invoice        | Admin, Staff         |
| POST   | `/invoices/generate-all`                      | Generate all monthly invoices  | Admin, Staff         |
| POST   | `/invoices/{invoice_id}/payments`             | Record a payment               | Admin, Staff, Tenant |
| POST   | `/invoices/apply-late-fees`                   | Apply late fees                | Admin, Staff         |
| GET    | `/invoices/reports/monthly`                   | Monthly payment report         | Admin, Staff         |
| GET    | `/invoices/tenants/payment-status`            | All tenants payment status     | Admin, Staff         |
| GET    | `/invoices/tenants/{tenant_id}/payment-status`| Tenant payment status          | Admin, Staff, Tenant |
| GET    | `/invoices/late-payers`                       | List late payers               | Admin, Staff         |

#### `GET /invoices`

List invoices with filtering and pagination.

**Query Parameters:**
| Param     | Type | Default | Description          |
| --------- | ---- | ------- | -------------------- |
| page      | int  | 1       | Page number          |
| limit     | int  | 10      | Items per page (1-100)|
| status    | str  | null    | Filter: pending/paid/late |
| month     | int  | null    | Filter by month (1-12) |
| year      | int  | null    | Filter by year       |
| tenant_id | int  | null    | Filter by tenant     |
| room_id   | int  | null    | Filter by room       |

**Note:** Tenants can only see their own invoices.

**Response (200):**
```json
{
  "data": [
    {
      "id": 1,
      "room_id": 1,
      "tenant_id": 1,
      "month": 3,
      "year": 2026,
      "amount": 500.00,
      "amount_paid": 500.00,
      "due_date": "2026-03-01",
      "status": "paid",
      "created_at": "2026-03-01T02:00:00",
      "paid_at": "2026-03-05T14:30:00",
      "room": { "id": 1, "name": "Room 101", "price": 500.00 },
      "tenant": { "id": 1, "name": "Jane Doe", "email": "jane@example.com" },
      "payments": [ ... ]
    }
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 1
  }
}
```

#### `GET /invoices/{invoice_id}`

Get a specific invoice.

**Errors:**
- `404` - Invoice not found
- `403` - Tenant accessing another tenant's invoice

#### `POST /invoices/generate`

Generate a single invoice.

**Request Body:**
```json
{
  "tenant_id": 1,
  "room_id": 1,
  "for_date": "2026-03-01",
  "is_first_invoice": false,
  "check_in_date": "2026-01-15"
}
```

**Validation:**
- `for_date`: ISO format (YYYY-MM-DD)
- `check_in_date`: ISO format (optional)

**Errors:**
- `400` - Validation error or invoice already exists

#### `POST /invoices/generate-all`

Generate monthly invoices for all active tenants.

**Request Body:**
```json
{
  "for_date": "2026-03-01"
}
```

#### `POST /invoices/{invoice_id}/payments`

Record a payment for an invoice.

**Request Body:**
```json
{
  "amount": 250.00,
  "image": "payment_proof.jpg"
}
```

**Validation:**
- `amount`: must be > 0

**Note:** Tenants can only pay their own invoices. Partial payments are supported.

**Errors:**
- `400` - Invalid amount or invoice not found
- `403` - Tenant paying another tenant's invoice

#### `POST /invoices/apply-late-fees`

Mark overdue invoices as late and apply fees.

**Request Body:**
```json
{
  "grace_period_days": 3
}
```

#### `GET /invoices/reports/monthly`

Get monthly payment report.

**Query Parameters:**
| Param | Type | Required | Description       |
| ----- | ---- | -------- | ----------------- |
| month | int  | Yes      | Month (1-12)      |
| year  | int  | Yes      | Year (>= 2000)    |

#### `GET /invoices/tenants/payment-status`

Get payment status for all tenants.

**Query Parameters:**
| Param | Type | Required | Description    |
| ----- | ---- | -------- | -------------- |
| month | int  | No       | Filter by month|
| year  | int  | No       | Filter by year |

#### `GET /invoices/tenants/{tenant_id}/payment-status`

Get payment status for a specific tenant.

**Note:** Tenants can only access their own payment status.

#### `GET /invoices/late-payers`

Get list of tenants with late payments.

**Query Parameters:**
| Param | Type | Required | Description    |
| ----- | ---- | -------- | -------------- |
| month | int  | No       | Filter by month|
| year  | int  | No       | Filter by year |

---

### Billing

> **Access:** Admin only

| Method | Endpoint                      | Description                     |
| ------ | ----------------------------- | ------------------------------- |
| POST   | `/billing/trigger-monthly`    | Trigger monthly billing         |
| POST   | `/billing/trigger-late-fees`  | Trigger late fee processing     |
| GET    | `/billing/scheduler-status`   | Get APScheduler status          |

#### `POST /billing/trigger-monthly`

Manually trigger monthly invoice generation.

**Response (200):**
```json
{
  "message": "Monthly billing completed",
  "stats": { ... }
}
```

#### `POST /billing/trigger-late-fees`

Manually trigger late fee processing.

**Response (200):**
```json
{
  "message": "Late fee processing completed",
  "stats": { ... }
}
```

#### `GET /billing/scheduler-status`

Get the APScheduler status and job list.

**Response (200):**
```json
{
  "scheduler_running": true,
  "total_jobs": 2,
  "jobs": [
    {
      "id": "monthly_billing",
      "name": "monthly_billing",
      "trigger": "cron[day='1', hour='2', minute='0']",
      "next_run": "2026-04-01T02:00:00"
    },
    {
      "id": "daily_late_fees",
      "name": "daily_late_fees",
      "trigger": "cron[hour='3', minute='0']",
      "next_run": "2026-03-16T03:00:00"
    }
  ]
}
```

---

## Data Models

### Role

| Column      | Type     | Notes           |
| ----------- | -------- | --------------- |
| id          | Integer  | Primary key     |
| name        | String   | Not null        |
| description | String   | Nullable        |
| status      | Boolean  | Default: true   |
| created_at  | DateTime | Auto-set        |
| updated_at  | DateTime | Auto-updated    |

### User

| Column   | Type    | Notes                |
| -------- | ------- | -------------------- |
| id       | Integer | Primary key          |
| name     | String  | Max 255, not null    |
| email    | String  | Unique, not null     |
| password | String  | Argon2 hashed        |
| image    | String  | File path (optional) |
| role_id  | Integer | FK → roles.id        |

### Room

| Column      | Type     | Notes                |
| ----------- | -------- | -------------------- |
| id          | Integer  | Primary key          |
| name        | String   | Max 255, not null    |
| description | String   | Max 255, nullable    |
| price       | Numeric  | (10,2), not null     |
| is_available| Boolean  | Default: true        |
| created_at  | DateTime | Auto-set             |
| updated_at  | DateTime | Auto-updated         |

### Tenant

| Column         | Type     | Notes                  |
| -------------- | -------- | ---------------------- |
| id             | Integer  | Primary key            |
| room_id        | Integer  | FK → rooms.id (unique) |
| name           | String   | Max 255, not null      |
| email          | String   | Unique, nullable       |
| phone          | String   | Max 50, nullable       |
| id_card        | String   | Max 100, nullable      |
| photo          | String   | Nullable               |
| is_active      | Boolean  | Default: true          |
| check_in_date  | DateTime | Auto-set               |
| check_out_date | DateTime | Nullable               |
| created_at     | DateTime | Auto-set               |
| updated_at     | DateTime | Auto-updated           |

### Invoice

| Column      | Type     | Notes                         |
| ----------- | -------- | ----------------------------- |
| id          | Integer  | Primary key                   |
| room_id     | Integer  | FK → rooms.id                 |
| tenant_id   | Integer  | FK → tenants.id               |
| month       | Integer  | 1-12                          |
| year        | Integer  | >= 2000                       |
| amount      | Float    | > 0                           |
| amount_paid | Float    | >= 0, default: 0              |
| due_date    | Date     | Not null                      |
| status      | Enum     | pending / paid / late         |
| created_at  | DateTime | Auto-set                      |
| paid_at     | DateTime | Nullable                      |

### Payment

| Column     | Type     | Notes                      |
| ---------- | -------- | -------------------------- |
| id         | Integer  | Primary key                |
| invoice_id | Integer  | FK → invoices.id           |
| amount     | Float    | Not null                   |
| image      | String   | Proof of payment (nullable)|
| status     | Enum     | pending / completed / failed|
| paid_at    | DateTime | Auto-set                   |
| created_at | DateTime | Auto-set                   |

---

## Role-Based Access Control

### Roles

| Role    | Description                           |
| ------- | ------------------------------------- |
| admin   | Full access to all endpoints          |
| staff   | Access to rooms, tenants, invoices    |
| tenant  | View own invoices, make payments      |

### Endpoint Access Matrix

| Endpoint                          | Admin | Staff | Tenant |
| --------------------------------- | ----- | ----- | ------ |
| `POST /login`                     | Yes   | Yes   | Yes    |
| All `/users` endpoints            | Yes   | No    | No     |
| All `/rooms` endpoints            | Yes   | Yes   | No     |
| All `/tenants` endpoints          | Yes   | Yes   | No     |
| `GET /invoices`                   | Yes   | Yes   | Yes*   |
| `GET /invoices/{id}`              | Yes   | Yes   | Yes*   |
| `POST /invoices/generate`         | Yes   | Yes   | No     |
| `POST /invoices/generate-all`     | Yes   | Yes   | No     |
| `POST /invoices/{id}/payments`    | Yes   | Yes   | Yes*   |
| `POST /invoices/apply-late-fees`  | Yes   | Yes   | No     |
| `GET /invoices/reports/monthly`   | Yes   | Yes   | No     |
| `GET /invoices/tenants/*`         | Yes   | Yes   | Yes*   |
| `GET /invoices/late-payers`       | Yes   | Yes   | No     |
| All `/billing` endpoints          | Yes   | No    | No     |

\* Tenants can only access their own data.

---

## Scheduled Jobs

APScheduler runs on server startup with two background jobs:

| Job               | Schedule              | Description                                     |
| ----------------- | --------------------- | ----------------------------------------------- |
| `monthly_billing` | 1st of month, 2:00 AM | Generates invoices for all active tenants/rooms |
| `daily_late_fees` | Every day, 3:00 AM    | Marks overdue invoices as `late` and applies fees|

Both jobs can also be triggered manually via the [Billing endpoints](#billing).

---

## Error Handling

### HTTP Status Codes

| Code | Description                        |
| ---- | ---------------------------------- |
| 200  | Success                            |
| 201  | Created                            |
| 400  | Bad Request (validation error)     |
| 401  | Unauthorized (invalid credentials) |
| 403  | Forbidden (insufficient role)      |
| 404  | Not Found                          |
| 500  | Internal Server Error              |

### Error Response Format

```json
{
  "detail": "Error message describing what went wrong"
}
```

---

## File Uploads

### User Profile Images

- Upload via multipart form data on `POST /users` and `PUT /users/{id}`
- Images are stored in the `uploads/` directory
- Access uploaded files at: `http://localhost:8000/uploads/<filename>`

### Payment Proof Images

- Include image filename in the payment request body
- Files are stored in the `uploads/` directory

### Public Files

- Static public files served from `src/public/`
- Access at: `http://localhost:8000/public/<filename>`

---

## Static File Endpoints

| Mount Point | Directory     | URL Prefix           |
| ----------- | ------------- | -------------------- |
| uploads     | `uploads/`    | `/uploads/`          |
| public      | `src/public/` | `/public/`           |

---

## CORS Configuration

The API allows all origins, methods, and headers by default:

```python
allow_origins=["*"]
allow_credentials=True
allow_methods=["*"]
allow_headers=["*"]
```

> **Note:** For production, restrict `allow_origins` to specific domains.
