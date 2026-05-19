# Room Management API - Implementation Guide for Presentation

---

## Slide 1: Project Overview

**What it is:** A RESTful API for managing rental properties — rooms, tenants, invoices, and payments.

**Built with:**
- **FastAPI** — Modern, high-performance Python web framework
- **SQLAlchemy 2.0** — ORM for database operations
- **PostgreSQL 16** — Relational database
- **APScheduler** — Background job scheduling
- **JWT + Argon2** — Secure authentication

**Architecture Pattern:** Layered Architecture (Routes → Services → Models)

```
┌─────────────────────────────────────────┐
│              FastAPI App                │
│  (src/main.py — entry point)            │
├─────────────────────────────────────────┤
│  Routes (API endpoints)                 │
│  ├── login.py                           │
│  ├── user.py                            │
│  ├── room.py                            │
│  ├── tenant.py                          │
│  ├── invoice.py                         │
│  └── billing.py                         │
├─────────────────────────────────────────┤
│  Services (Business Logic)              │
│  ├── user.py    — auth, CRUD            │
│  ├── room.py    — room + payment status │
│  ├── tenant.py  — tenant lifecycle      │
│  ├── invoice.py — billing, reports      │
│  └── task.py    — scheduled tasks       │
├─────────────────────────────────────────┤
│  Models (Database ORM)                  │
│  ├── role.py, user.py                   │
│  ├── room.py, tenant.py                 │
│  ├── invoice.py, payment.py             │
├─────────────────────────────────────────┤
│  PostgreSQL Database                    │
└─────────────────────────────────────────┘
```

---

## Slide 2: Project Structure

```
api/
├── src/main.py                  # FastAPI app — routers, CORS, static files, scheduler
├── src/app/
│   ├── config/
│   │   ├── config.py            # Environment variables (DATABASE_URL, SECRET_KEY)
│   │   ├── base.py              # SQLAlchemy declarative base
│   │   ├── session.py           # DB engine + session factory (get_db)
│   │   ├── scheduler.py         # APScheduler init (cron jobs)
│   │   └── logger.py            # Security logging
│   ├── model/                   # SQLAlchemy ORM models
│   │   ├── role.py              # Role (admin, staff, tenant)
│   │   ├── user.py              # User (name, email, password, role_id)
│   │   ├── room.py              # Room (name, price, is_available)
│   │   ├── tenant.py            # Tenant (name, room_id, check_in/out)
│   │   ├── invoice.py           # Invoice (amount, status, due_date)
│   │   └── payment.py           # Payment (amount, image, status)
│   ├── schema/                  # Pydantic request/response schemas
│   ├── routes/                  # FastAPI APIRouter endpoints
│   ├── services/                # Business logic layer
│   ├── middleware/
│   │   ├── jwt_service.py       # JWT encode/decode/verify
│   │   └── guard/permission.py  # Role-based access control
│   ├── utils/
│   │   ├── argon2.py            # Password hashing
│   │   ├── device_tracker.py    # Client IP + browser detection
│   │   └── get_image.py         # File upload handler
│   └── database/
│       └── index.py             # Database seeder CLI
├── docker-compose.yml           # PostgreSQL + pgAdmin
├── alembic/                     # Database migrations
└── .env                         # Environment secrets
```

---

## Slide 3: Database Schema (6 Tables)

### Relationships

```
roles (1) ────< (N) users
                        │
                        │ (email match)
                        ▼
rooms (1) ────< (1) tenants ────< (N) invoices ────< (N) payments
```

### Table Details

**roles**
| Column      | Type    | Notes              |
| ----------- | ------- | ------------------ |
| id          | Integer | PK, auto-increment |
| name        | String  | admin/staff/tenant |
| description | String  | Nullable           |
| status      | Boolean | Default: true      |

**users**
| Column   | Type    | Notes               |
| -------- | ------- | ------------------- |
| id       | Integer | PK                  |
| name     | String  | Not null            |
| email    | String  | Unique, not null    |
| password | String  | Argon2 hashed       |
| image    | String  | File path (nullable)|
| role_id  | Integer | FK → roles.id       |

**rooms**
| Column       | Type     | Notes              |
| ------------ | -------- | ------------------ |
| id           | Integer  | PK                 |
| name         | String   | Not null           |
| description  | String   | Nullable           |
| price        | Numeric  | (10,2), not null   |
| is_available | Boolean  | Default: true      |
| created_at   | DateTime | Auto-set           |
| updated_at   | DateTime | Auto-updated       |

**tenants**
| Column         | Type     | Notes                   |
| -------------- | -------- | ----------------------- |
| id             | Integer  | PK                      |
| room_id        | Integer  | FK → rooms.id (unique)  |
| name           | String   | Not null                |
| email          | String   | Unique, nullable        |
| phone          | String   | Nullable                |
| id_card        | String   | Nullable                |
| is_active      | Boolean  | Default: true           |
| check_in_date  | DateTime | Auto-set                |
| check_out_date | DateTime | Nullable                |

**invoices**
| Column      | Type    | Notes                          |
| ----------- | ------- | ------------------------------ |
| id          | Integer | PK                             |
| room_id     | Integer | FK → rooms.id (CASCADE delete) |
| tenant_id   | Integer | FK → tenants.id (CASCADE)      |
| month       | Integer | 1–12                           |
| year        | Integer | >= 2000                        |
| amount      | Float   | > 0                            |
| amount_paid | Float   | >= 0, default: 0               |
| due_date    | Date    | 5th of the month               |
| status      | Enum    | pending / paid / late          |
| created_at  | DateTime| Auto-set                       |
| paid_at     | DateTime| Nullable                       |

**payments**
| Column     | Type     | Notes                       |
| ---------- | -------- | --------------------------- |
| id         | Integer  | PK                          |
| invoice_id | Integer  | FK → invoices.id (CASCADE)  |
| amount     | Float    | Not null                    |
| image      | String   | Proof of payment (nullable) |
| status     | Enum     | pending / completed / failed|
| paid_at    | DateTime | Auto-set                    |

---

## Slide 4: Authentication Flow

### Login Process

```
Client                          Server
  │                               │
  │  POST /login                  │
  │  { email, password }          │
  │ ───────────────────────────>  │
  │                               │
  │                    UserService.login()
  │                    ├── Query User by email
  │                    ├── verify_password() (Argon2)
  │                    └── Return UserResponse
  │                               │
  │                    JWTService.create_access_token()
  │                    └── Payload: { sub, role, exp }
  │                               │
  │  { access_token, info }       │
  │  <──────────────────────────  │
  │                               │
```

### Key Files

**`src/app/utils/argon2.py`** — Password hashing:
```python
from argon2 import PasswordHasher

def hash_password(password: str) -> str:
    ph = PasswordHasher()
    return ph.hash(password)

def verify_password(hashed_password: str, plain_password: str) -> bool:
    ph = PasswordHasher()
    try:
        ph.verify(hashed_password, plain_password)
        return True
    except VerifyMismatchError:
        return False
```

**`src/app/middleware/jwt_service.py`** — Token management:
```python
from jose import jwt, JWTError

class JWTService:
    @staticmethod
    def create_access_token(data, secret_key, algorithm, expires_delta):
        to_encode = data.copy()
        expire = datetime.utcnow() + expires_delta
        to_encode.update({"exp": expire})
        return jwt.encode(to_encode, secret_key, algorithm)

    @staticmethod
    def verify_token(token, secret_key, algorithms):
        return jwt.decode(token, secret_key, algorithms)
```

**`src/app/utils/device_tracker.py`** — Device info on login:
```python
from user_agents import parse

class DeviceTracker:
    @staticmethod
    def get_device_info(request: Request):
        user_agent = parse(request.headers.get("User-Agent"))
        return {
            "ip": DeviceTracker.get_client_ip(request),
            "browser": f"{user_agent.browser.family}",
            "os": f"{user_agent.os.family}",
            "device": f"{user_agent.device.family}",
            "is_mobile": user_agent.is_mobile,
        }
```

---

## Slide 5: Role-Based Access Control (RBAC)

### How It Works

```
Request with Bearer Token
         │
         ▼
┌─────────────────────────────────┐
│  PermissionGuard.get_current_user() │
│  1. Extract token from header   │
│  2. JWTService.verify_token()   │
│  3. DB: User by id + role       │
│  4. Return User object          │
└─────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│  PermissionGuard.allow_roles()  │
│  Compare user.role.name         │
│  against allowed set            │
│  Match → pass                   │
│  No match → 403 Forbidden       │
└─────────────────────────────────┘
         │
         ▼
    Route Handler
```

### Implementation (`src/app/middleware/guard/permission.py`)

```python
class PermissionGuard:

    @staticmethod
    def get_current_user(token=Depends(security), db=Depends(get_db)):
        payload = JWTService.verify_token(token.credentials, SECRET_KEY, ALGORITHM)
        user_id = payload.get("sub")
        return UserService.get_user_by_id(db, user_id)

    @staticmethod
    def allow_roles(*roles: str):
        allowed = {role.lower() for role in roles}

        def checker(current_user=Depends(PermissionGuard.get_current_user)):
            role_name = getattr(current_user.role, "name", "")
            if not role_name or role_name.lower() not in allowed:
                raise HTTPException(status_code=403, detail="Insufficient privileges")
            return current_user
        return checker

    @staticmethod
    def resolve_tenant_for_user(db, current_user):
        """Bridge User → Tenant via email matching"""
        if current_user.role.name.lower() != "tenant":
            return None
        tenant = db.query(Tenant).filter(Tenant.email == current_user.email).first()
        if not tenant or not tenant.is_active:
            raise HTTPException(status_code=403, detail="Tenant record not found")
        return tenant
```

### Router-Level Enforcement

```python
# Users — Admin only
user_router = APIRouter(
    dependencies=[Depends(PermissionGuard.allow_roles("admin"))],
)

# Rooms — Admin + Staff
room_router = APIRouter(
    dependencies=[Depends(PermissionGuard.allow_roles("admin", "staff"))],
)

# Invoices — Per-endpoint (Admin/Staff/Tenant)
@invoice_router.get("/")
def get_invoices(current_user=Depends(PermissionGuard.allow_roles("admin", "staff", "tenant"))):
    tenant = PermissionGuard.resolve_tenant_for_user(db, current_user)
    if tenant:
        query = query.filter(Invoice.tenant_id == tenant.id)  # Data isolation
```

---

## Slide 6: Room Management — Business Logic

### Key Features

1. **Room CRUD** — Create, read, update, delete (only vacant rooms)
2. **Tenant Assignment** — Assign tenant to room, auto-generate first invoice
3. **Payment Status Dashboard** — Each room shows: available/occupied, paid/pending/late, amount due, latest payment

### Room Response Builder (`src/app/services/room.py`)

```python
def _build_room_response(room, current_month):
    if room.is_available:
        return RoomDetailResponse(status="available", ...)

    # Find current month's invoice
    current_invoice = next(
        (inv for inv in room.invoices
         if inv.year == current_month.year and inv.month == current_month.month),
        None
    )

    # Determine payment status
    if current_invoice is None:
        payment_status = "no_invoice"
    elif current_invoice.status == InvoiceStatus.paid:
        payment_status = "paid"
    elif current_invoice.status == InvoiceStatus.late:
        payment_status = "late"
    else:
        payment_status = "pending"

    return RoomDetailResponse(
        status="occupied",
        tenant=tenant_info,
        payment_status=payment_status,
        amount_due=amount_due,
        latest_payment=latest_payment,
    )
```

### Tenant Assignment Flow

```python
def assign_tenant(db, room_id, tenant_id):
    room = db.query(Room).filter(Room.id == room_id).first()
    tenant = db.query(Tenant).filter(Tenant.id == tenant_id).first()

    # Unassign from old room if needed
    if tenant.room_id is not None and tenant.is_active:
        raise ValueError("Tenant already assigned to a room")

    # Assign
    tenant.room_id = room_id
    tenant.is_active = True
    tenant.check_in_date = datetime.now(timezone.utc)
    room.is_available = False

    # Auto-generate first (prorated) invoice
    InvoiceService.generate_invoice(
        db, tenant_id=tenant.id, room_id=room_id,
        for_date=current_month, is_first_invoice=True,
        check_in_date=tenant.check_in_date.date()
    )
```

---

## Slide 7: Invoice & Billing System

### Invoice Generation (`src/app/services/invoice.py`)

```python
def generate_invoice(db, tenant_id, room_id, for_date, is_first_invoice=False, check_in_date=None):
    # Check duplicate
    existing = db.query(Invoice).filter(
        Invoice.tenant_id == tenant_id,
        Invoice.year == for_date.year,
        Invoice.month == for_date.month
    ).first()
    if existing:
        return existing

    # Calculate amount (prorated for first month)
    amount = float(room.price)
    if is_first_invoice and check_in_date:
        amount = _calculate_prorated_amount(room.price, check_in_date, for_date)

    invoice = Invoice(
        room_id=room_id, tenant_id=tenant_id,
        month=for_date.month, year=for_date.year,
        amount=amount, due_date=for_date.replace(day=5),
        status=InvoiceStatus.pending
    )
    db.add(invoice)
```

### Prorated Amount Calculation

```python
def _calculate_prorated_amount(room_price, check_in_date, invoice_date):
    days_in_month = calendar.monthrange(invoice_date.year, invoice_date.month)[1]
    remaining_days = days_in_month - check_in_date.day + 1
    return round((room_price / days_in_month) * remaining_days, 2)
```

### Payment Recording

```python
def record_payment(db, invoice_id, amount, image=None):
    invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()

    # Cap payment at remaining balance
    remaining = float(invoice.amount) - float(invoice.amount_paid)
    payment_amount = min(amount, remaining)

    payment = Payment(
        invoice_id=invoice_id, amount=payment_amount,
        image=image, status=PaymentStatus.completed
    )

    invoice.amount_paid += payment_amount

    # Auto-update status
    if invoice.amount_paid >= invoice.amount:
        invoice.status = InvoiceStatus.paid
        invoice.paid_at = datetime.now(timezone.utc)
```

### Late Fee Processing

```python
LATE_FEE_PERCENTAGE = 0.05  # 5%

def update_late_invoices(db, grace_period_days=3):
    overdue = db.query(Invoice).filter(
        Invoice.status == InvoiceStatus.pending,
        Invoice.due_date < (today - relativedelta(days=grace_period_days))
    ).all()

    for invoice in overdue:
        invoice.status = InvoiceStatus.late
        late_fee = float(invoice.amount) * LATE_FEE_PERCENTAGE
        invoice.amount += late_fee
```

---

## Slide 8: Scheduled Jobs (APScheduler)

### Configuration (`src/app/config/scheduler.py`)

```python
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger

scheduler = BackgroundScheduler()

def init_scheduler():
    # Monthly billing — 1st of every month at 2:00 AM
    scheduler.add_job(
        func=run_monthly_billing,
        trigger=CronTrigger(day=1, hour=2, minute=0),
        id="monthly_billing",
        misfire_grace_time=3600  # 1 hour grace
    )

    # Daily late fees — Every day at 3:00 AM
    scheduler.add_job(
        func=run_daily_late_fees,
        trigger=CronTrigger(hour=3, minute=0),
        id="daily_late_fees",
        misfire_grace_time=1800  # 30 min grace
    )

    scheduler.start()
```

### Task Execution (`src/app/services/task.py`)

```python
def run_monthly_billing():
    db = SessionLocal()
    try:
        stats = InvoiceService.generate_all_monthly_invoices(db, date.today())
        db.commit()
        return stats
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()

def run_daily_late_fees():
    db = SessionLocal()
    try:
        stats = InvoiceService.update_late_invoices(db)
        db.commit()
        return stats
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()
```

### Lifecycle in FastAPI (`src/main.py`)

```python
@app.on_event("startup")
def on_startup():
    init_scheduler()

@app.on_event("shutdown")
def on_shutdown():
    shutdown_scheduler()
```

---

## Slide 9: Database Session & Configuration

### Session Management (`src/app/config/session.py`)

```python
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

engine = create_engine(
    settings.DATABASE_URL,
    echo=False,
    pool_pre_ping=True,  # Connection health check
)

local_session = sessionmaker(bind=engine, autoflush=False, autocommit=False)

def get_db():
    db = local_session()
    try:
        yield db
    finally:
        db.close()  # Always close, even on error
```

### Environment Config (`src/app/config/config.py`)

```python
import os
from dotenv import load_dotenv

load_dotenv()

class Setting:
    DATABASE_URL: str = os.getenv("DATABASE_URL")
    SECRET_KEY: str = os.getenv("SECRET_KEY")
    ALGORITHM: str = os.getenv("ALGORITHM")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))

settings = Setting()
```

---

## Slide 10: File Upload Handling

### Image Upload (`src/app/utils/get_image.py`)

```python
allowed_image_types = ["image/jpeg", "image/png", "image/gif", "image/webp"]

def get_image(image):
    # Validate content type
    if image.content_type not in allowed_image_types:
        raise ValueError("Invalid image type")

    # Sanitize filename
    safe_filename = re.sub(r"[^a-zA-Z0-9_.-]", "_", image.filename)

    # Handle duplicate filenames
    file_path = os.path.join("uploads/images", safe_filename)
    if os.path.exists(file_path):
        base, ext = os.path.splitext(safe_filename)
        counter = 1
        while os.path.exists(file_path):
            safe_filename = f"{base}_{counter}{ext}"
            file_path = os.path.join("uploads/images", safe_filename)
            counter += 1

    # Save file
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(image.file, buffer)

    return file_path
```

### Usage in User Routes

```python
@user_router.post("", response_model=UserResponse)
def create_user(
    name: str = Form(...),
    email: str = Form(...),
    password: str = Form(...),
    role_id: int = Form(...),
    image: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
):
    image_path = get_image(image) if image else None
    return UserService.create_user(db, UserCreate(...), image)
```

### Static File Serving (`src/main.py`)

```python
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")
app.mount("/public", StaticFiles(directory="src/public"), name="public")
```

---

## Slide 11: Database Seeder

### Seeder CLI (`src/app/database/index.py`)

```bash
python -m src.app.database.index              # Default: 20 rooms, 20 tenants
python -m src.app.database.index --rooms 15 --tenants 10
python -m src.app.database.index --no-clear   # Append without clearing
python -m src.app.database.index --dry-run    # Preview only
```

### Seeding Order

1. **Clear** — Truncate all tables, reset auto-increment IDs
2. **Roles** — Insert admin, staff, tenant roles
3. **Users** — Create admin + staff accounts (hashed passwords)
4. **Rooms** — Generate N rooms (mix of available/occupied)
5. **Tenants** — Create tenants, assign to occupied rooms
6. **Invoices** — Generate monthly invoices per tenant
7. **Payments** — Add partial/full payments for variety

### Seeded Accounts

| Role  | Email             | Password |
| ----- | ----------------- | -------- |
| Admin | admin@example.com | admin123 |
| Staff | john@rental.com   | staff123 |
| Staff | emma@rental.com   | staff123 |
| Staff | mike@rental.com   | staff123 |

---

## Slide 12: Error Handling

### HTTP Status Codes

| Code | Meaning                      | Example                            |
| ---- | ---------------------------- | ---------------------------------- |
| 200  | Success                      | GET /rooms returns list            |
| 201  | Created                      | POST /users creates user           |
| 400  | Bad Request                  | Invalid input, room has tenant     |
| 401  | Unauthorized                 | Invalid token, wrong password      |
| 403  | Forbidden                    | Insufficient role                  |
| 404  | Not Found                    | User/room/tenant/invoice not found |
| 500  | Internal Server Error        | Database error, unexpected failure |

### Error Response Format

```json
{
  "detail": "Room is already occupied by active tenant: Jane Doe"
}
```

### Transaction Safety

```python
try:
    result = RoomService.assign_tenant(db, room_id, tenant_id)
    db.commit()
    return result
except ValueError as e:
    db.rollback()
    raise HTTPException(status_code=400, detail=str(e))
except Exception as e:
    db.rollback()
    raise HTTPException(status_code=500, detail=str(e))
```

---

## Slide 13: API Endpoints Summary

| Module    | Endpoints | Access              | Key Features                          |
| --------- | --------- | ------------------- | ------------------------------------- |
| Login     | 1         | Public              | JWT token + device tracking           |
| Users     | 6         | Admin               | CRUD + image upload                   |
| Rooms     | 6         | Admin, Staff        | CRUD + assign tenant + payment status |
| Tenants   | 4         | Admin, Staff        | CRUD + check-in/check-out             |
| Invoices  | 10        | Admin/Staff/Tenant* | Generate, pay, reports, late payers   |
| Billing   | 3         | Admin               | Trigger jobs, scheduler status        |

\* Tenants can only access their own data.

---

## Slide 14: Key Technical Highlights

### 1. Layered Architecture
- **Routes** handle HTTP request/response
- **Services** contain all business logic
- **Models** define database schema
- **Schemas** validate input/output with Pydantic

### 2. Dependency Injection
FastAPI's `Depends()` wires everything together:
```python
def get_user(id: int, db=Depends(get_db), current_user=Depends(PermissionGuard.allow_roles("admin"))):
```

### 3. Eager Loading
Prevents N+1 query problems with `selectinload`:
```python
db.query(Room).options(
    selectinload(Room.tenant),
    selectinload(Room.invoices).selectinload(Invoice.payments)
)
```

### 4. Pagination + Search
Consistent across all list endpoints:
```python
class QueryParameters(BaseModel):
    page: int = 1
    limit: int = 100
    search: Optional[str] = None
```

### 5. Data Isolation for Tenants
Tenants only see their own invoices via `resolve_tenant_for_user()`:
```python
tenant = PermissionGuard.resolve_tenant_for_user(db, current_user)
if tenant:
    query = query.filter(Invoice.tenant_id == tenant.id)
```

### 6. Prorated First Invoice
When a tenant checks in mid-month, the first invoice is prorated:
```python
prorated = (room_price / days_in_month) * remaining_days
```

### 7. Automatic Late Fee Processing
5% late fee applied after grace period, runs daily at 3 AM.

---

## Slide 15: Demo Walkthrough

### Suggested Demo Flow

1. **Login** as admin → get JWT token
2. **List rooms** → show available/occupied with payment status
3. **Create a tenant** → name, email, phone, id_card
4. **Assign tenant to room** → auto-generates prorated invoice
5. **View invoice** → shows amount, due date, status
6. **Record payment** → partial or full, with proof image
7. **Check payment status** → room dashboard updates
8. **Trigger monthly billing** → generates invoices for all active tenants
9. **Apply late fees** → marks overdue invoices, adds 5% fee
10. **View monthly report** → collection rate, paid/pending/late counts

### Quick Test Commands

```bash
# Login
curl -X POST http://localhost:8000/api/v1/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}'

# List rooms (use token from login)
curl http://localhost:8000/api/v1/rooms \
  -H "Authorization: Bearer <token>"

# Trigger monthly billing
curl -X POST http://localhost:8000/api/v1/billing/trigger-monthly \
  -H "Authorization: Bearer <token>"
```

---

## Slide 16: Q&A Preparation

### Common Questions & Answers

**Q: Why FastAPI instead of Django/Flask?**
A: FastAPI provides automatic OpenAPI docs, async support, type validation via Pydantic, and dependency injection — all out of the box.

**Q: How is security handled?**
A: Passwords are hashed with Argon2 (not MD5/SHA). JWT tokens expire after 60 minutes. Role-based guards prevent unauthorized access. CORS is configured.

**Q: What happens if the scheduler crashes?**
A: Each task has `misfire_grace_time` — if the server was down during a scheduled run, it will execute within the grace window. Tasks use try/except with rollback.

**Q: How do you prevent duplicate invoices?**
A: `generate_invoice` checks for existing invoices by `(tenant_id, year, month)` before creating. If one exists, it returns the existing record.

**Q: Can a tenant have multiple rooms?**
A: No. `tenant.room_id` has a unique constraint — one tenant, one room at a time.

**Q: How are partial payments handled?**
A: `record_payment` caps the payment at the remaining balance. Multiple payments can be recorded until `amount_paid >= amount`, then status becomes `paid`.
