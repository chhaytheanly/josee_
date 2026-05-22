# Room Management API — Comprehensive Technical Report

---

## 1. Introduction

The Room Management API is a production-grade RESTful backend system for managing rental properties. It provides a complete operational toolkit covering room inventory, tenant lifecycle, automated monthly billing, payment tracking, and financial reporting. The system is architected around a strict layered pattern—**Routes → Services → Models**—and incorporates enterprise-grade security with JWT authentication, Argon2 password hashing, role-based access control (RBAC), and structured audit logging.

| Aspect | Detail |
|---|---|
| **Framework** | FastAPI 0.133 |
| **ORM** | SQLAlchemy 2.0 |
| **Database** | PostgreSQL 16 |
| **Auth** | python-jose (JWT) + argon2-cffi |
| **Scheduler** | APScheduler 3.11 |
| **Server** | Uvicorn |
| **Migrations** | Alembic |
| **Containerization** | Docker Compose (PostgreSQL + pgAdmin) |
| **PDF Generation** | ReportLab |

---

## 2. Problem Statement

Manual management of rental operations introduces systemic inefficiencies:

- **Inconsistent record-keeping** — Tenant assignments, payments, and room availability tracked across disparate spreadsheets or paper logs.
- **Missed billing cycles** — Monthly invoice generation is a repetitive, error-prone manual task often delayed or forgotten.
- **Limited payment visibility** — No centralized view of which tenants have paid, are overdue, or have partial balances.
- **No automated enforcement** — Late fees depend on manual detection rather than policy-based automation.
- **Security gaps** — Shared credentials, no audit trail, and no role-based access differentiation between administrative and operational staff.

This API addresses every point above through a unified, data-centric platform with automated workflows.

---

## 3. Methodology

The development followed a database-first, layered approach:

1. **Schema design** — Define all SQLAlchemy ORM models with relationships, foreign keys, check constraints, and indexes before writing any application logic.
2. **Validation layer** — Build Pydantic schemas to enforce input/output type safety and format validation at the API boundary.
3. **Business logic layer** — Encapsulate domain rules within stateless service classes; routes only handle HTTP concerns.
4. **Security integration** — Layer authentication (JWT + Argon2) and authorization (role guards) on top of routes via FastAPI dependency injection.
5. **Operational automation** — Add APScheduler for cron-based recurring tasks and structured audit logging for security events.
6. **Data population** — Build a CLI seeder for development and testing with configurable room/tenant counts and seeded accounts.

---

## 4. Implementation — Detailed Breakdown

### 4.1 Project Structure

```
api/
├── docker-compose.yml                 # PostgreSQL 16 + pgAdmin 4
├── Dockerfile                         # Application container
├── alembic.ini                        # Alembic configuration
├── alembic/versions/                  # Auto-generated migration files
├── pyproject.toml                     # Project metadata
├── requirements.txt                   # Python dependencies
├── .env                               # Environment secrets (excluded from VCS)
├── logs/
│   └── security_audit.log             # Rotating security audit log
├── uploads/images/                    # Uploaded profile/payment images
└── src/
    ├── main.py                        # FastAPI entry point
    ├── index.html                     # Landing page
    ├── public/
    │   └── images/favicon.ico
    └── app/
        ├── config/
        │   ├── __init__.py            # Re-exports init_scheduler, shutdown_scheduler
        │   ├── base.py                # SQLAlchemy DeclarativeBase
        │   ├── config.py              # Environment-driven settings singleton
        │   ├── logger.py              # Security audit logger (rotating file + console)
        │   ├── scheduler.py           # APScheduler initialization and lifecycle
        │   └── session.py             # Engine creation, session factory, get_db generator
        ├── database/
        │   ├── __init__.py
        │   ├── index.py               # Seeder CLI entry point (argparse)
        │   └── seed/
        │       ├── base.py            # BaseSeeder — reusable CRUD + batch flushing
        │       ├── role.py            # Seeds admin/staff/tenant roles
        │       ├── user.py            # Seeds admin + staff users
        │       ├── room.py            # Seeds N rooms from catalog
        │       ├── tenant.py          # Seeds tenants assigned to rooms
        │       ├── invoice.py         # Seeds historical invoices
        │       ├── payment.py         # Seeds partial/full payments
        │       ├── clear.py           # Truncates all tables
        │       ├── seeder.py          # DatabaseSeeder orchestrator
        │       └── seed.py            # Room catalog data
        ├── middleware/
        │   ├── __init__.py
        │   ├── jwt_service.py         # JWT encode/decode/verify
        │   └── guard/
        │       └── permission.py      # PermissionGuard — RBAC enforcement
        ├── model/                     # SQLAlchemy ORM models (6 tables)
        │   ├── __init__.py
        │   ├── role.py
        │   ├── user.py
        │   ├── room.py
        │   ├── tenant.py
        │   ├── invoice.py
        │   └── payment.py
        ├── routes/                    # FastAPI APIRouters (6 routers)
        │   ├── __init__.py
        │   ├── login.py
        │   ├── user.py
        │   ├── room.py
        │   ├── tenant.py
        │   ├── invoice.py
        │   └── billing.py
        ├── schema/                    # Pydantic request/response models
        │   ├── __init__.py
        │   ├── user.py
        │   ├── room.py
        │   ├── tenant.py
        │   ├── invoice.py
        │   ├── query.py
        │   ├── role.py
        │   └── payment.py
        ├── services/                  # Business logic
        │   ├── __init__.py
        │   ├── user.py                # Auth, CRUD, password reset
        │   ├── room.py                # Room CRUD, assign tenant, payment status
        │   ├── tenant.py              # Tenant lifecycle
        │   ├── invoice.py             # Billing engine, payment recording, reports
        │   ├── invoice_pdf.py         # PDF invoice generation (ReportLab)
        │   └── task.py                # Scheduler task wrappers
        └── utils/
            ├── __init__.py
            ├── argon2.py              # Password hashing and verification
            ├── base64_converter.py    # Base64 image encoding utility
            ├── color.py               # ANSI color codes for terminal
            ├── device_tracker.py      # Client IP + user-agent parsing
            ├── email.py               # Password reset email (fastapi-mail)
            ├── get_image.py           # File upload handler with validation
            └── token_util.py          # Reset token generation
```

### 4.2 System Architecture — Layers and Data Flow

```
┌──────────────────────────────────────────────────────────┐
│                   FastAPI Application                    │
│                    (src/main.py)                         │
│  ┌──────────┐ ┌─────────┐ ┌────────┐ ┌──────────┐        │
│  │ CORS     │ │ Static  │ │ Router │ │Scheduler │        │
│  │Middleware│ │ Mounts  │ │Registry│ │Lifecycle │        │
│  └──────────┘ └─────────┘ └────────┘ └──────────┘        │
├──────────────────────────────────────────────────────────┤
│  Routes (src/app/routes/)                                │
│  ┌──────────┐ ┌──────────┐ ┌─────────┐ ┌───────────┐     │
│  │ login.py │ │ user.py  │ │room.py  │ │tenant.py  │     │
│  └──────────┘ └──────────┘ └─────────┘ └───────────┘     │ 
│  ┌────────────┐ ┌──────────┐                             │
│  │invoice.py  │ │billing.py│                             │
│  └────────────┘ └──────────┘                             │ 
├──────────────────────────────────────────────────────────┤
│  Middleware (JWT + PermissionGuard)                      │
│  Validates token → resolves user → checks role → pass    │
├──────────────────────────────────────────────────────────┤
│  Services (src/app/services/)                            │
│  ┌──────────┐ ┌──────────┐ ┌─────────┐ ┌───────────┐     │
│  │user.py   │ │room.py   │ │tenant.py│ │invoice.py │     │
│  └──────────┘ └──────────┘ └─────────┘ └───────────┘     │
│  ┌──────────┐ ┌──────────────┐                           │
│  │task.py   │ │invoice_pdf.py│                           │
│  └──────────┘ └──────────────┘                           │
├──────────────────────────────────────────────────────────┤
│  Models (SQLAlchemy ORM)                                 │
│  role.py ←→ user.py ←→ room.py ←→ tenant.py              │
│  tenant.py ←→ invoice.py ←→ payment.py                   │
├──────────────────────────────────────────────────────────┤
│  PostgreSQL Database                                     │
└──────────────────────────────────────────────────────────┘
```

**Request lifecycle:**

```
Client Request
    │
    ▼
┌──────────────────────┐
│  CORS Middleware     │  ← allow_origins=["*"]
└──────────────────────┘
    │
    ▼
┌──────────────────────┐
│  PermissionGuard     │  ← Extracts Bearer token
│  JWTService.verify() │  ← Decodes JWT payload
│  UserService.get()   │  ← Loads user + role from DB
│  allow_roles() check │  ← Compares role to allowed set
└──────────────────────┘
    │
    ▼
┌──────────────────────┐
│  Route Handler       │  ← Receives validated DTO
│  Call Service Method │  ← Business logic
│  Commit / Rollback   │  ← Transaction control
│  Return Response     │  ← Pydantic-validated
└──────────────────────┘
    │
    ▼
Client Response
```

### 4.3 Database Schema — Complete Definition

#### Entity-Relationship Diagram

```
┌─────────┐       ┌─────────┐
│  roles  │1────N │  users  │
└─────────┘       └─────────┘
                       │
                       │ (email match)
                       ▼
┌─────────┐       ┌──────────┐       ┌──────────┐       ┌──────────┐
│  rooms  │1────1 │ tenants  │1────N │ invoices │1────N │ payments │
└─────────┘       └──────────┘       └──────────┘       └──────────┘
```

#### roles

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | Integer | PK, Identity(start=1) | Auto-increment |
| `name` | String(255) | NOT NULL | `admin`, `staff`, `tenant` |
| `description` | String(255) | NULLABLE | Human-readable description |
| `status` | Boolean | NULLABLE, DEFAULT true | Active flag |
| `created_at` | DateTime | DEFAULT now() | Auto-set |
| `updated_at` | DateTime | DEFAULT now(), ON UPDATE now() | Auto-updated |

**Relationships:** `users = relationship("User", back_populates="role")` — one-to-many

#### users

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | Integer | PK, Identity(start=1) | Auto-increment |
| `name` | String(255) | NOT NULL | Full name |
| `email` | String(255) | NOT NULL, UNIQUE | Login identifier |
| `password` | String(255) | NOT NULL | Argon2 hash |
| `image` | String(255) | NULLABLE | File path to profile image |
| `role_id` | Integer | NOT NULL, FK → roles.id | Admin/staff/tenant |
| `reset_token` | String(255) | NULLABLE | Password reset token |
| `reset_token_expiry` | DateTime | NULLABLE | Token expiry timestamp |

**Constraints:**
- `CheckConstraint("email LIKE '%@%'", name="valid_email")`

**Relationships:** `role = relationship("Role", back_populates="users")`

#### rooms

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | Integer | PK, Identity(start=1) | Auto-increment |
| `name` | String(255) | NOT NULL | Room identifier (e.g., "Room 101") |
| `description` | String(255) | NULLABLE | Description/features |
| `price` | Numeric(10,2) | NOT NULL | Monthly rent amount |
| `is_available` | Boolean | DEFAULT true | Vacant = true |
| `created_at` | DateTime | DEFAULT now() | Auto-set |
| `updated_at` | DateTime | DEFAULT now(), ON UPDATE now() | Auto-updated |

**Relationships:**
- `tenant = relationship("Tenant", back_populates="room", uselist=False)` — one-to-one (single active tenant)
- `invoices = relationship("Invoice", back_populates="room")` — one-to-many

#### tenants

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | Integer | PK, Identity(start=1) | Auto-increment |
| `room_id` | Integer | FK → rooms.id, UNIQUE, ondelete="SET NULL" | Currently assigned room |
| `name` | String(255) | NOT NULL | Full name |
| `email` | String(255) | NULLABLE, UNIQUE | Contact email |
| `phone` | String(50) | NULLABLE | Contact phone |
| `id_card` | String(100) | NULLABLE | Government ID number |
| `photo` | String(255) | NULLABLE | File path to photo |
| `is_active` | Boolean | DEFAULT true | Active = currently renting |
| `check_in_date` | DateTime | DEFAULT now() | Move-in date |
| `check_out_date` | DateTime | NULLABLE | Move-out date |
| `created_at` | DateTime | DEFAULT now() | Auto-set |
| `updated_at` | DateTime | DEFAULT now(), ON UPDATE now() | Auto-updated |

**Relationships:**
- `room = relationship("Room", back_populates="tenant")`
- `invoices = relationship("Invoice", back_populates="tenant")`

**Important:** `room_id` UNIQUE constraint enforces one tenant per room. When a tenant checks out (`is_active = False`), `room_id` is set to NULL and the room becomes available.

#### invoices

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | Integer | PK, Identity(start=1) | Auto-increment |
| `room_id` | Integer | NOT NULL, FK → rooms.id, ondelete="CASCADE" | Room being billed |
| `tenant_id` | Integer | NOT NULL, FK → tenants.id, ondelete="CASCADE" | Tenant billed |
| `month` | Integer | NOT NULL | 1–12 |
| `year` | Integer | NOT NULL | >= 2000 |
| `amount` | Float | NOT NULL | Total due |
| `amount_paid` | Float | DEFAULT 0.0 | Amount paid so far |
| `due_date` | Date | NOT NULL | Payment due (5th of month) |
| `status` | Enum | DEFAULT 'pending' | `pending`, `paid`, `late` |
| `created_at` | DateTime | DEFAULT now() | Auto-set |
| `paid_at` | DateTime | NULLABLE | Set when fully paid |

**Check constraints:**
- `CheckConstraint("month BETWEEN 1 AND 12", name="valid_month")`
- `CheckConstraint("year >= 2000", name="valid_year")`
- `CheckConstraint("amount > 0", name="positive_amount")`
- `CheckConstraint("amount_paid >= 0", name="non_negative_amount_paid")`

**Indexes:**
- `Index("ix_invoice_tenant_period", "tenant_id", "year", "month")` — fast lookup for duplicate prevention and billing queries

**Relationships:**
- `room = relationship("Room", back_populates="invoices")`
- `tenant = relationship("Tenant", back_populates="invoices")`
- `payments = relationship("Payment", back_populates="invoice", cascade="all, delete")`

#### payments

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | Integer | PK, Identity(start=1) | Auto-increment |
| `invoice_id` | Integer | NOT NULL, FK → invoices.id, ondelete="CASCADE" | Parent invoice |
| `amount` | Float | NOT NULL | Payment amount |
| `image` | String(255) | NULLABLE | Proof-of-payment file path |
| `status` | Enum | DEFAULT 'pending' | `pending`, `completed`, `failed` |
| `paid_at` | DateTime | DEFAULT now() | Payment timestamp |
| `created_at` | DateTime | DEFAULT now() | Auto-set |

**Relationships:** `invoice = relationship("Invoice", back_populates="payments")`

---

### 4.4 Application Configuration

#### Environment Settings (`src/app/config/config.py`)

The `Setting` class loads configuration from `.env`:

```python
class Setting:
    DATABASE_URL: str                          # PostgreSQL connection string
    SECRET_KEY: str                            # JWT signing key
    ALGORITHM: str                             # JWT algorithm (HS256)
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60      # Token expiry
    MAIL_USERNAME: str = ""                    # SMTP username
    MAIL_PASSWORD: str = ""                    # SMTP password
    MAIL_FROM: str = ""                        # Sender address
    MAIL_PORT: int = 587                       # SMTP port
    MAIL_SERVER: str = "smtp.gmail.com"        # SMTP host
    MAIL_STARTTLS: bool = True                 # STARTTLS flag
    MAIL_SSL_TLS: bool = False                 # SSL/TLS flag
    FRONTEND_URL: str = "http://localhost:3000" # Frontend URL for reset links

settings = Setting()
```

#### Database Session Management (`src/app/config/session.py`)

```python
engine = create_engine(
    settings.DATABASE_URL,
    echo=False,            # Disable SQL logging in production
    pool_pre_ping=True,    # Connection health check before use
)

local_session = sessionmaker(bind=engine, autoflush=False, autocommit=False)

def get_db():
    """FastAPI dependency that yields a session and ensures cleanup."""
    db = local_session()
    try:
        yield db
    finally:
        db.close()  # Always close, even if an exception occurs
```

Key design decisions:
- `pool_pre_ping=True` verifies connections are alive before use, preventing stale connection errors.
- `autoflush=False` gives explicit control over when SQL is emitted.
- The `get_db()` generator is used as a FastAPI `Depends()` — sessions are automatically closed after each request.

---

### 4.5 Security Implementation

#### 4.5.1 Password Hashing (`src/app/utils/argon2.py`)

```python
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError

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

Argon2 is the current OWASP-recommended password hashing algorithm. It is resistant to GPU-based brute-force attacks and includes built-in salt generation.

#### 4.5.2 JWT Service (`src/app/middleware/jwt_service.py`)

```python
class JWTService:
    @staticmethod
    def create_access_token(data, secret_key, algorithm, expires_delta):
        to_encode = data.copy()
        expire = datetime.utcnow() + expires_delta
        to_encode.update({"exp": expire})
        return jwt.encode(to_encode, secret_key, algorithm)

    @staticmethod
    def verify_token(token, secret_key, algorithms):
        try:
            return jwt.decode(token, secret_key, algorithms)
        except JWTError:
            raise ValueError("Invalid token")
```

**Token payload structure:**
```json
{
  "sub": "<user_id>",
  "role": "<role_id>",
  "exp": "<unix_timestamp>"
}
```

Tokens expire after `ACCESS_TOKEN_EXPIRE_MINUTES` (default: 60 minutes).

#### 4.5.3 Authentication Flow (`src/app/routes/login.py`)

```
Client                          Server
  │                               │
  │  POST /api/v1/login           │
  │  { email, password }          │
  │ ─────────────────────────────>│
  │                               │
  │    1. UserService.login()     │
  │       ├── Query User by email │
  │       ├── verify_password()   │
  │       └── Return UserResponse │
  │                               │
  │    2. DeviceTracker           │
  │       ├── get_client_ip()     │
  │       └── get_device_info()   │
  │                               │
  │    3. security_logger.info()  │
  │       └── Log login event     │
  │                               │
  │    4. JWTService.create()     │
  │       └── Payload: sub, role  │
  │                               │
  │  { access_token, user }       │
  │  <────────────────────────────│
```

Key login route implementation:
```python
@loggin_router.post("", response_model=Token)
def login(request: Request, data: LoginRequest, db: Session = Depends(get_db)):
    try:
        user = UserService.login(db, data)
        info = DeviceTracker.get_device_info(request)
        client_ip = DeviceTracker.get_client_ip(request)
        security_logger.info(
            f"User {user.email} logged in from IP {client_ip} "
            f"with device info: {info}"
        )
    except ValueError:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token_data = {"sub": str(user.id), "role": user.role_id}
    access_token = JWTService.create_access_token(
        data=token_data,
        secret_key=settings.SECRET_KEY,
        algorithm=settings.ALGORITHM,
        expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
    )
    user_response = UserResponse.model_validate(user)
    return {"access_token": access_token, "token_type": "bearer", "user": user_response}
```

#### 4.5.4 Device Tracking (`src/app/utils/device_tracker.py`)

```python
class DeviceTracker:
    @staticmethod
    def get_client_ip(request: Request) -> str:
        x_forwarded_for = request.headers.get("X-Forwarded-For")
        if x_forwarded_for:
            return x_forwarded_for.split(",")[0].strip()
        return request.client.host

    @staticmethod
    def get_device_info(request: Request) -> dict:
        user_agent = parse(request.headers.get("User-Agent", "Unknown"))
        return {
            "ip": DeviceTracker.get_client_ip(request),
            "is_mobile": f"{user_agent.is_mobile}",
            "is_tablet": f"{user_agent.is_tablet}",
            "is_pc": f"{user_agent.is_pc}",
            "browser": f"{user_agent.browser.family} {user_agent.browser.version_string}",
            "os": f"{user_agent.os.family} {user_agent.os.version_string}",
            "device": f"{user_agent.device.family}",
        }
```

The device tracker uses the `user-agents` Python library to parse User-Agent strings. It correctly handles proxies via the `X-Forwarded-For` header.

#### 4.5.5 Role-Based Access Control (`src/app/middleware/guard/permission.py`)

```python
class PermissionGuard:
    @staticmethod
    def get_current_user(token=Depends(security), db=Depends(get_db)):
        """Extract JWT, verify, and return User with role loaded."""
        try:
            payload = JWTService.verify_token(
                token.credentials,
                secret_key=os.getenv("SECRET_KEY"),
                algorithms=os.getenv("ALGORITHM").split(",")
            )
            user_id = payload.get("sub")
            if user_id is None:
                raise HTTPException(status_code=401, detail="Invalid token")
            return UserService.get_user_by_id(db, user_id)
        except ValueError:
            raise HTTPException(status_code=401, detail="Invalid token")

    @staticmethod
    def allow_roles(*roles: str):
        """Return a dependency checker that validates role membership."""
        allowed = {role.lower() for role in roles}

        def checker(current_user=Depends(PermissionGuard.get_current_user)):
            role_name = getattr(current_user.role, "name", "")
            if not role_name or role_name.lower() not in allowed:
                raise HTTPException(status_code=403, detail="Insufficient privileges")
            return current_user

        return checker

    @staticmethod
    def resolve_tenant_for_user(db, current_user):
        """Bridge User → Tenant via email matching for data isolation."""
        if current_user.role.name.lower() != "tenant":
            return None
        tenant = db.query(Tenant).filter(Tenant.email == current_user.email).first()
        if not tenant or not tenant.is_active:
            raise HTTPException(status_code=403, detail="Tenant record not found")
        return tenant
```

**Router-level enforcement:**

| Router | Dependency | Access |
|---|---|---|
| `user_router` | `allow_roles("admin")` | Admin only |
| `room_router` | `allow_roles("admin", "staff")` | Admin + Staff |
| `tenant_router` | `allow_roles("admin", "staff")` | Admin + Staff |
| `invoice_router` | Per-endpoint | Admin/Staff/Tenant* |
| `billing_router` | `allow_roles("admin")` | Admin only |

**Tenant data isolation:** When a tenant accesses invoice endpoints, `resolve_tenant_for_user()` matches `User.email` to `Tenant.email`. If resolved, all queries are automatically filtered by `Invoice.tenant_id == tenant.id`, ensuring tenants can only see their own data.

#### 4.5.6 Password Reset Flow

**Step 1 — Request reset (`POST /api/v1/login/forgot-password`):**
```python
async def forgot_password(data: ForgotPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email).first()
    if not user:
        return {"message": "If the email exists, a reset link has been sent"}

    token = generate_reset_token()  # secrets.token_urlsafe(32)
    expiry = get_token_expiry()     # datetime.utcnow() + timedelta(minutes=30)

    user.reset_token = token
    user.reset_token_expiry = expiry
    db.commit()

    await send_reset_email(email, token)
    return {"message": "If the email exists, a reset link has been sent"}
```

**Step 2 — Execute reset (`POST /api/v1/login/reset-password`):**
```python
def reset_password(data: ResetPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.reset_token == data.token).first()
    if not user:
        raise ValueError("Invalid or expired reset token")

    if user.reset_token_expiry is None or user.reset_token_expiry < datetime.utcnow():
        user.reset_token = None
        user.reset_token_expiry = None
        db.commit()
        raise ValueError("Invalid or expired reset token")

    user.password = hash_password(data.new_password)
    user.reset_token = None
    user.reset_token_expiry = None
    db.commit()
    return {"message": "Password reset successfully"}
```

**Email notification (`src/app/utils/email.py`):**
```python
async def send_reset_email(email: str, token: str):
    reset_link = f"{settings.FRONTEND_URL}/reset-password?token={token}"

    message = MessageSchema(
        subject="Reset Password",
        recipients=[email],
        body=f"Click the link below to reset your password:\n\n{reset_link}\n\n"
             f"This link will expire in 30 minutes.\n\n"
             f"If you did not request a password reset, please ignore this email.",
        subtype="plain"
    )
    fm = FastMail(conf)
    await fm.send_message(message)
```

---

### 4.6 Audit Logging (`src/app/config/logger.py`)

```python
import logging
from logging.handlers import RotatingFileHandler

os.makedirs("logs", exist_ok=True)

def setup_logger():
    logger = logging.getLogger("security_audit")
    logger.setLevel(logging.INFO)

    formatter = logging.Formatter(
        '%(asctime)s | %(levelname)s | %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )

    # Console output
    ch = logging.StreamHandler()
    ch.setFormatter(formatter)
    logger.addHandler(ch)

    # Rotating file output (10 MB max, 5 backups)
    fh = RotatingFileHandler("logs/security_audit.log", maxBytes=10*1024*1024, backupCount=5)
    fh.setFormatter(formatter)
    logger.addHandler(fh)

    return logger

security_logger = setup_logger()
```

**Log format:** `2026-05-22 14:30:00 | INFO | User admin@example.com logged in from IP 192.168.1.1 with device info: {'ip': '192.168.1.1', 'browser': 'Chrome 125', 'os': 'Windows 10', 'device': 'Desktop', 'is_mobile': 'False'}`

**Storage:** `logs/security_audit.log` (rotating: 10 MB per file, keep 5 generations).

---

### 4.7 Business Logic — Core Services

#### 4.7.1 Room Service (`src/app/services/room.py`)

**Room CRUD:**
- `create_room()` — Validates unique name, creates room with optional availability flag.
- `update_room()` — Partial update via `model_dump(exclude_unset=True)`.
- `delete_room()` — Prevents deletion if room is occupied (`is_available == False`).

**Room Response Builder (the dashboard engine):**

```python
def _build_room_response(room: Room, current_month: date) -> RoomDetailResponse:
    if room.is_available:
        return RoomDetailResponse(status="available", ...)

    # Build tenant info
    tenant_info = {
        "id": room.tenant.id,
        "name": room.tenant.name,
        "email": room.tenant.email,
        "phone": room.tenant.phone,
        "check_in_date": room.tenant.check_in_date,
        "is_active": room.tenant.is_active
    } if room.tenant else None

    # Find current month's invoice
    current_invoice = next(
        (inv for inv in room.invoices
         if inv.year == current_month.year and inv.month == current_month.month),
        None
    )

    # Determine payment status
    if current_invoice is None:
        payment_status = "no_invoice"
        amount_due = float(room.price)
        due_date = current_month.replace(day=5)
    elif current_invoice.status == InvoiceStatus.paid:
        payment_status = "paid"
        amount_due = 0.0
        due_date = current_invoice.due_date
    elif current_invoice.status == InvoiceStatus.late:
        payment_status = "late"
        amount_due = float(current_invoice.amount) - float(current_invoice.amount_paid)
        due_date = current_invoice.due_date
    else:
        payment_status = "pending"
        amount_due = float(current_invoice.amount) - float(current_invoice.amount_paid)
        due_date = current_invoice.due_date

    # Find latest completed payment
    latest_payment = None
    if current_invoice and current_invoice.payments:
        completed_payments = [p for p in current_invoice.payments if p.status == PaymentStatus.completed]
        if completed_payments:
            latest = max(completed_payments, key=lambda p: p.paid_at)
            latest_payment = {"id": latest.id, "amount": float(latest.amount), "paid_at": latest.paid_at}

    return RoomDetailResponse(
        status="occupied",
        tenant=tenant_info,
        payment_status=payment_status,
        amount_due=amount_due,
        due_date=due_date,
        latest_payment=latest_payment,
        ...
    )
```

**Tenant Assignment Flow (the most complex business operation):**

```python
def assign_tenant(db: Session, room_id: int, tenant_id: int) -> Tenant:
    room = db.query(Room).filter(Room.id == room_id).first()
    if not room:
        raise ValueError("Room not found")

    # Check for conflicting tenant already assigned
    conflicting_tenant = db.query(Tenant).filter(Tenant.room_id == room_id).first()
    if conflicting_tenant:
        if conflicting_tenant.is_active:
            raise ValueError(f"Room is already occupied by active tenant: {conflicting_tenant.name}")
        conflicting_tenant.room_id = None  # Clear inactive tenant

    # Verify room is available
    if not room.is_available:
        active_tenant = db.query(Tenant).filter(
            Tenant.room_id == room_id, Tenant.is_active == True
        ).first()
        if not active_tenant:
            room.is_available = True  # Clean up stale state
        else:
            raise ValueError(f"Room is already occupied by: {active_tenant.name}")

    tenant = db.query(Tenant).filter(Tenant.id == tenant_id).first()
    if not tenant:
        raise ValueError("Tenant not found")

    # Verify tenant isn't already assigned elsewhere
    if tenant.room_id is not None and tenant.is_active:
        raise ValueError(f"Tenant is already assigned to room {tenant.room_id}")

    # Execute assignment
    tenant.room_id = room_id
    tenant.is_active = True
    tenant.check_in_date = datetime.now(timezone.utc)

    room.is_available = False
    room.updated_at = datetime.now(timezone.utc)

    db.flush()

    # Auto-generate prorated first invoice
    current_month = date.today().replace(day=1)
    InvoiceService.generate_invoice(
        db,
        tenant_id=tenant.id,
        room_id=room_id,
        for_date=current_month,
        is_first_invoice=True,
        check_in_date=tenant.check_in_date.date()
    )

    return tenant
```

Key business rules enforced:
- One active tenant per room (UNIQUE constraint on `tenants.room_id`)
- Tenant cannot be assigned to two rooms simultaneously
- Inactive (checked-out) tenants are cleaned up automatically
- First invoice is always generated and prorated for mid-month check-ins
- Multiple rooms query performance is optimized via `selectinload(Room.tenant)` and `selectinload(Room.invoices).selectinload(Invoice.payments)` to avoid N+1 queries

#### 4.7.2 Invoice Service (`src/app/services/invoice.py`)

**Invoice Generation with Duplicate Prevention:**

```python
def generate_invoice(db, tenant_id, room_id, for_date,
                     is_first_invoice=False, check_in_date=None):
    # Duplicate check — idempotent
    existing = db.query(Invoice).filter(
        Invoice.tenant_id == tenant_id,
        Invoice.year == for_date.year,
        Invoice.month == for_date.month
    ).first()
    if existing:
        return existing  # Already exists, return it

    room = db.query(Room).filter(Room.id == room_id).first()
    if not room:
        raise ValueError("Room not found")

    amount = float(room.price)

    # Prorate for mid-month check-in
    if is_first_invoice and check_in_date:
        amount = _calculate_prorated_amount(float(room.price), check_in_date, for_date)

    invoice = Invoice(
        room_id=room_id,
        tenant_id=tenant_id,
        month=for_date.month,
        year=for_date.year,
        amount=amount,
        due_date=for_date.replace(day=5),
        status=InvoiceStatus.pending,
        amount_paid=0.0
    )
    db.add(invoice)
    db.flush()
    return invoice
```

**Prorated Amount Calculation:**

```python
def _calculate_prorated_amount(room_price, check_in_date, invoice_date):
    days_in_month = calendar.monthrange(invoice_date.year, invoice_date.month)[1]
    remaining_days = days_in_month - check_in_date.day + 1
    return round((room_price / days_in_month) * remaining_days, 2)
```

Example: Room costs $600/month, tenant checks in on the 15th of a 30-day month. Prorated amount = (600 / 30) * 16 = $320.00.

**Bulk Monthly Invoice Generation:**

```python
def generate_all_monthly_invoices(db, for_date=None):
    if for_date is None:
        for_date = date.today()

    active_tenants = db.query(Tenant).filter(
        Tenant.is_active == True,
        Tenant.room_id.isnot(None)
    ).all()

    stats = {"created": 0, "skipped": 0, "failed": 0}
    for tenant in active_tenants:
        try:
            existing = db.query(Invoice).filter(
                Invoice.tenant_id == tenant.id,
                Invoice.year == for_date.year,
                Invoice.month == for_date.month
            ).first()
            if existing:
                stats["skipped"] += 1
            else:
                InvoiceService.generate_invoice(db, tenant.id, tenant.room_id, for_date)
                stats["created"] += 1
        except Exception:
            stats["failed"] += 1

    return stats
```

**Payment Recording:**

```python
def record_payment(db, invoice_id, amount, image=None):
    invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not invoice:
        raise ValueError("Invoice not found")
    if amount <= 0:
        raise ValueError("Payment amount must be greater than 0")

    remaining_balance = float(invoice.amount) - float(invoice.amount_paid)
    payment_amount = min(amount, remaining_balance)  # Cap at remaining balance

    payment = Payment(
        invoice_id=invoice_id,
        amount=payment_amount,
        image=image,
        status=PaymentStatus.completed,
        paid_at=datetime.now(timezone.utc),
    )

    invoice.amount_paid = float(invoice.amount_paid) + payment_amount

    # Auto-update invoice status
    if invoice.amount_paid >= invoice.amount:
        invoice.status = InvoiceStatus.paid
        invoice.paid_at = datetime.now(timezone.utc)
    elif invoice.due_date < date.today() and invoice.status != InvoiceStatus.late:
        invoice.status = InvoiceStatus.late

    db.add(payment)
    db.flush()
    return payment
```

Key payment rules:
- Multiple partial payments allowed until full amount is covered
- Payment is capped at remaining balance (no overpayment)
- Invoice automatically transitions to `paid` with timestamp when fully covered
- Late status auto-applied if due date has passed

**Late Fee Processing:**

```python
LATE_FEE_PERCENTAGE = 0.05  # 5%

def update_late_invoices(db, grace_period_days=3):
    today = date.today()
    late_threshold = today - relativedelta(days=grace_period_days)

    overdue = db.query(Invoice).filter(
        Invoice.status == InvoiceStatus.pending,
        Invoice.due_date < late_threshold
    ).all()

    marked_late = 0
    for invoice in overdue:
        if invoice.status != InvoiceStatus.late:
            invoice.status = InvoiceStatus.late
            late_fee = float(invoice.amount) * LATE_FEE_PERCENTAGE
            invoice.amount = float(invoice.amount) + late_fee
            marked_late += 1

    db.flush()
    return {"marked_late": marked_late}
```

After a 3-day grace period past the due date, unpaid invoices:
1. Are marked as `late`
2. Receive a 5% penalty fee added to the total amount

**Monthly Payment Report:**

```python
def get_payment_report(db, month, year):
    invoices = db.query(Invoice).options(
        selectinload(Invoice.room), selectinload(Invoice.tenant)
    ).filter(Invoice.month == month, Invoice.year == year).all()

    total_expected = sum(float(inv.amount) for inv in invoices)
    total_received = sum(float(inv.amount_paid) for inv in invoices)

    return {
        "month": month,
        "year": year,
        "summary": {
            "total_invoices": len(invoices),
            "total_expected": total_expected,
            "total_received": total_received,
            "collection_rate": round((total_received / total_expected * 100), 2)
                              if total_expected > 0 else 0.0,
            "paid_count": sum(1 for inv in invoices if inv.status == "paid"),
            "pending_count": sum(1 for inv in invoices if inv.status == "pending"),
            "late_count": sum(1 for inv in invoices if inv.status == "late"),
        },
        "data": [
            {
                "invoice_id": inv.id,
                "room_name": inv.room.name,
                "tenant_name": inv.tenant.name,
                "amount": float(inv.amount),
                "amount_paid": float(inv.amount_paid),
                "status": inv.status.value,
                "due_date": inv.due_date.isoformat(),
                "paid_at": inv.paid_at.isoformat() if inv.paid_at else None,
            }
            for inv in invoices
        ]
    }
```

#### 4.7.3 Tenant Service (`src/app/services/tenant.py`)

**Check-out Flow:**

```python
def remove_tenant(db, tenant_id):
    tenant = db.query(Tenant).filter(Tenant.id == tenant_id).first()
    if not tenant:
        raise ValueError("Tenant not found")

    room_id = tenant.room_id

    # Deactivate tenant
    tenant.room_id = None
    tenant.is_active = False
    tenant.check_out_date = datetime.now(timezone.utc)

    # Free up the room
    if room_id:
        room = db.query(Room).filter(Room.id == room_id).first()
        if room:
            room.is_available = True

    db.flush()
    return tenant
```

On check-out:
- Tenant's `is_active` set to `False`
- `check_out_date` recorded
- `room_id` set to `NULL`
- Room's `is_available` restored to `True`

---

### 4.8 API Endpoints — Complete Reference

All endpoints are prefixed with `/api/v1`.

#### 4.8.1 Authentication

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/login` | Public | Authenticate, receive JWT + device info |
| POST | `/login/forgot-password` | Public | Request password reset email |
| POST | `/login/reset-password` | Public | Execute password reset |

#### 4.8.2 Users (Admin only)

| Method | Endpoint | Description |
|---|---|---|
| POST | `/users` | Create user (multipart: name, email, password, role_id, image) |
| GET | `/users` | List all users (paginated) |
| GET | `/users/{id}` | Get user by ID |
| GET | `/users/setup-form` | Get form metadata (roles dropdown options) |
| PUT | `/users/{id}` | Update user (multipart, partial) |
| DELETE | `/users/{id}` | Delete user |

#### 4.8.3 Rooms (Admin + Staff)

| Method | Endpoint | Description |
|---|---|---|
| POST | `/rooms` | Create room (name, description, price, is_available) |
| GET | `/rooms` | List all rooms with payment status dashboard (paginated, searchable) |
| GET | `/rooms/{room_id}` | Get room details with tenant + payment info |
| PUT | `/rooms/{room_id}` | Update room (partial) |
| DELETE | `/rooms/{room_id}` | Delete room (only if vacant) |
| POST | `/rooms/{room_id}/assign` | Assign tenant to room (auto-generates prorated invoice) |

#### 4.8.4 Tenants (Admin + Staff)

| Method | Endpoint | Description |
|---|---|---|
| POST | `/tenants` | Create tenant |
| GET | `/tenants` | List all tenants (paginated, searchable) |
| GET | `/tenants/{tenant_id}` | Get tenant by ID with related data |
| DELETE | `/tenants/{tenant_id}` | Check-out tenant (frees room) |

#### 4.8.5 Invoices (Varies)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/invoices` | Admin/Staff/Tenant* | List invoices (filterable by status, month, year, tenant, room) |
| GET | `/invoices/{invoice_id}` | Admin/Staff/Tenant* | Get invoice by ID |
| POST | `/invoices/generate` | Admin/Staff | Generate single invoice |
| POST | `/invoices/generate-all` | Admin/Staff | Generate invoices for all active tenants |
| POST | `/invoices/{invoice_id}/payments` | Admin/Staff/Tenant* | Record payment (supports partial) |
| POST | `/invoices/apply-late-fees` | Admin/Staff | Apply late fees with configurable grace period |
| GET | `/invoices/reports/monthly` | Admin/Staff | Monthly payment report with collection rate |
| GET | `/invoices/tenants/payment-status` | Admin/Staff | Payment status for all tenants |
| GET | `/invoices/tenants/{tenant_id}/payment-status` | Admin/Staff/Tenant* | Payment status for specific tenant |
| GET | `/invoices/late-payers` | Admin/Staff | List tenants with late payments |
| GET | `/invoices/{invoice_id}/download` | Admin/Staff/Tenant* | Download invoice as PDF |

\* Tenants can only access their own data via email-matching isolation.

#### 4.8.6 Billing (Admin only)

| Method | Endpoint | Description |
|---|---|---|
| POST | `/billing/trigger-monthly` | Manually trigger monthly invoice generation |
| POST | `/billing/trigger-late-fees` | Manually trigger late fee processing |
| GET | `/billing/scheduler-status` | Get APScheduler status and scheduled jobs |

---

### 4.9 Scheduler Automation (APScheduler)

#### Configuration (`src/app/config/scheduler.py`)

```python
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger

scheduler = BackgroundScheduler()

def init_scheduler():
    """Initialize and start the APScheduler — called on FastAPI startup."""
    from src.app.services.task import run_daily_late_fees, run_monthly_billing

    if scheduler.running:
        return

    # Monthly billing — 1st of every month at 2:00 AM
    scheduler.add_job(
        func=run_monthly_billing,
        trigger=CronTrigger(day=1, hour=2, minute=0),
        id="monthly_billing",
        name="Generate monthly invoices",
        replace_existing=True,
        misfire_grace_time=3600  # 1 hour grace period
    )

    # Daily late fees — Every day at 3:00 AM
    scheduler.add_job(
        func=run_daily_late_fees,
        trigger=CronTrigger(hour=3, minute=0),
        id="daily_late_fees",
        name="Process late fees",
        replace_existing=True,
        misfire_grace_time=1800  # 30 minutes grace period
    )

    scheduler.start()
    logger.info("APScheduler started successfully")

def shutdown_scheduler():
    """Shutdown the scheduler gracefully — called on FastAPI shutdown."""
    if scheduler.running:
        scheduler.shutdown()
        logger.info("APScheduler shutdown complete")

def get_scheduler():
    """Return the scheduler instance (for status endpoint)."""
    return scheduler
```

#### Lifecycle in FastAPI (`src/main.py`)

```python
@app.on_event("startup")
def on_startup():
    init_scheduler()

@app.on_event("shutdown")
def on_shutdown():
    shutdown_scheduler()
```

#### Task Execution (`src/app/services/task.py`)

Each task opens its own database session, commits on success, and rolls back on failure:

```python
def run_monthly_billing():
    db = SessionLocal()
    try:
        logger.info("Starting monthly billing task")
        stats = InvoiceService.generate_all_monthly_invoices(db, date.today())
        db.commit()
        logger.info("Monthly billing complete: %s", stats)
        return stats
    except Exception as e:
        db.rollback()
        logger.exception("Monthly billing failed: %s", str(e))
        raise
    finally:
        db.close()

def run_daily_late_fees():
    db = SessionLocal()
    try:
        logger.info("Starting late fee processing task")
        stats = InvoiceService.update_late_invoices(db)
        db.commit()
        logger.info("Late fee processing complete: %s", stats)
        return stats
    except Exception as e:
        db.rollback()
        logger.exception("Late fee processing failed: %s", str(e))
        raise
    finally:
        db.close()
```

#### Manual Trigger via Billing Endpoints

Admin users can trigger both jobs on demand:

```python
@router.post("/trigger-monthly")
def trigger_monthly_billing():
    stats = run_monthly_billing()
    return {"message": "Monthly billing completed", "stats": stats}

@router.post("/trigger-late-fees")
def trigger_late_fees():
    stats = run_daily_late_fees()
    return {"message": "Late fee processing completed", "stats": stats}

@router.get("/scheduler-status")
def get_scheduler_status():
    scheduler = get_scheduler()
    jobs = [{
        "id": job.id,
        "name": job.name,
        "trigger": str(job.trigger),
        "next_run": job.next_run_time.isoformat() if job.next_run_time else None
    } for job in scheduler.get_jobs()]

    return {
        "scheduler_running": scheduler.running,
        "total_jobs": len(jobs),
        "jobs": jobs
    }
```

**Scheduler status response example:**
```json
{
  "scheduler_running": true,
  "total_jobs": 2,
  "jobs": [
    {
      "id": "monthly_billing",
      "name": "Generate monthly invoices",
      "trigger": "cron[day='1', hour='2', minute='0']",
      "next_run": "2026-06-01T02:00:00"
    },
    {
      "id": "daily_late_fees",
      "name": "Process late fees",
      "trigger": "cron[hour='3', minute='0']",
      "next_run": "2026-05-23T03:00:00"
    }
  ]
}
```

---

### 4.10 PDF Invoice Generation (`src/app/services/invoice_pdf.py`)

The system generates professional PDF invoices using ReportLab:

```python
class InvoicePDFService:
    @staticmethod
    def generate_invoice_pdf(db: Session, invoice_id: int) -> bytes:
        invoice = db.query(Invoice).options(
            selectinload(Invoice.tenant),
            selectinload(Invoice.room),
            selectinload(Invoice.payments),
        ).filter(Invoice.id == invoice_id).first()

        if not invoice:
            raise ValueError(f"Invoice {invoice_id} not found")

        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4, ...)

        # Build document with:
        # ┌──────────────────────────────────────┐
        # │  COMPANY_NAME              INVOICE   │
        # ├──────────────────────────────────────┤
        # │  Invoice Details   │  Tenant Info    │
        # │  ────────────────  │  ────────────   │
        # │  Invoice #: 12     │  Name: Jane...  │
        # │  Due Date: ...     │  Room: 101...   │
        # │  Period: June 2026 │  Check-in: ...  │
        # ├──────────────────────────────────────┤
        # │  Payment Summary                     │
        # │  ┌───────────────────────────┐       │
        # │  │ Description   │ Amount    │       │
        # │  │ Monthly Rent  │ $500.00   │       │
        # │  │ Amount Paid   │ $500.00   │       │
        # │  │ Remaining     │ $0.00     │       │
        # │  └───────────────────────────┘       │
        # ├──────────────────────────────────────┤
        # │  Payment History (if any)            │
        # ├──────────────────────────────────────┤
        # │  Invoice Status: PAID (color-coded)  │
        # └──────────────────────────────────────┘

        doc.build(story)
        buffer.seek(0)
        return buffer.getvalue()

    @staticmethod
    def get_filename(invoice: Invoice) -> str:
        return f"invoice_{invoice.year}_{invoice.month:02d}_{invoice.id}.pdf"
```

The PDF includes a color-coded status badge: green for `paid`, amber for `pending`, red for `late`. Payment history table is included when payments exist.

---

### 4.11 File Upload Handler (`src/app/utils/get_image.py`)

```python
allowed_image_types = ["image/jpeg", "image/png", "image/gif", "image/jpg", "image/webp"]
directory = "uploads/images"

os.makedirs(directory, exist_ok=True)

def get_image(image):
    # 1. Validate content type
    if image.content_type not in allowed_image_types:
        raise ValueError("Invalid image type")

    # 2. Sanitize filename (strip special chars)
    original_filename = image.filename
    safe_filename = re.sub(r"[^a-zA-Z0-9_.-]", "_", original_filename)

    # 3. Handle duplicate filenames
    file_path = os.path.join(directory, safe_filename)
    if os.path.exists(file_path):
        base, ext = os.path.splitext(safe_filename)
        counter = 1
        while os.path.exists(file_path):
            safe_filename = f"{base}_{counter}{ext}"
            file_path = os.path.join(directory, safe_filename)
            counter += 1

    # 4. Save file
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(image.file, buffer)

    return file_path
```

Uploaded files are accessible at `http://localhost:8000/uploads/images/<filename>` via the static file mount.

---

### 4.12 Database Seeder

#### CLI Usage

```bash
python -m src.app.database.index                          # 20 rooms, 20 tenants
python -m src.app.database.index --rooms 15 --tenants 10  # Custom counts
python -m src.app.database.index --no-clear               # Append data
python -m src.app.database.index --dry-run                # Preview only
```

#### Seeder Architecture

The seeder uses a `BaseSeeder` class with reusable CRUD helpers:

```python
class BaseSeeder:
    def __init__(self, db: Session, model: Type, count: int = 0): ...

    def exists(self, **filters) -> bool:
        """Check if record exists."""
        return self.db.query(self.model).filter_by(**filters).first() is not None

    def create_one(self, factory, skip_if_exists=True, **unique_fields):
        """Create single record. Optionally skip if already exists."""
        instance = self.model(**factory())
        self.db.add(instance)
        self.db.flush()
        return instance

    def create_many(self, factory, skip_if_exists=True, unique_field="id", batch_size=50):
        """Create multiple records with batch flushing for performance."""
        ...
```

#### Seeding Order

| Step | Action | Details |
|---|---|---|
| 1 | **Clear** | Truncate all 6 tables & reset auto-increment IDs via raw SQL |
| 2 | **Roles** | Insert admin, staff, tenant roles |
| 3 | **Users** | Create 1 admin + 3 staff accounts with Argon2-hashed passwords |
| 4 | **Rooms** | Generate N rooms from a predefined catalog with varied prices |
| 5 | **Tenants** | Create tenants, assign to rooms, set check-in dates |
| 6 | **Invoices** | Generate monthly invoices for each active tenant |
| 7 | **Payments** | Add partial/full payments for invoice variety |

#### Seeded Accounts

| Role | Email | Password |
|---|---|---|
| Admin | admin@example.com | admin123 |
| Staff | john@rental.com | staff123 |
| Staff | emma@rental.com | staff123 |
| Staff | mike@rental.com | staff123 |

---

### 4.13 Error Handling

#### HTTP Status Code Map

| Code | Meaning | When |
|---|---|---|
| 200 | Success | GET/PUT/DELETE operations succeed |
| 201 | Created | POST creates a new resource |
| 400 | Bad Request | Invalid input, validation error, business rule violation |
| 401 | Unauthorized | Missing/invalid JWT, wrong password |
| 403 | Forbidden | Insufficient role, tenant accessing other's data |
| 404 | Not Found | Resource does not exist |
| 500 | Internal Server Error | Unexpected database or system error |

#### Global Error Pattern

Every mutating route follows this transaction safety pattern:

```python
try:
    result = Service.method(db, ...)
    db.commit()
    return result
except ValueError as e:
    db.rollback()
    raise HTTPException(status_code=400, detail=str(e))
except Exception as e:
    db.rollback()
    raise HTTPException(status_code=500, detail=str(e))
```

All error responses return a consistent JSON structure:
```json
{
  "detail": "Descriptive error message"
}
```

---

### 4.14 Pydantic Schema Validation

**Request validation** — Example `InvoiceCreate` schema:
```python
class InvoiceCreate(BaseModel):
    tenant_id: int = Field(..., gt=0)
    room_id: int = Field(..., gt=0)
    for_date: str = Field(..., pattern=r"^\d{4}-\d{2}-\d{2}$")
    is_first_invoice: Optional[bool] = False
    check_in_date: Optional[str] = Field(None, pattern=r"^\d{4}-\d{2}-\d{2}$")

    @field_validator('for_date', 'check_in_date')
    @classmethod
    def validate_date_format(cls, v):
        if v is None:
            return v
        date.fromisoformat(v)  # throws on invalid
        return v
```

**Response serialization** — Example `RoomDetailResponse`:
```python
class RoomDetailResponse(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    price: float
    is_available: bool
    status: str           # "available" | "occupied"
    tenant: Optional[dict] = None
    payment_status: Optional[str] = None  # "paid" | "pending" | "late" | "no_invoice"
    amount_due: float = 0.0
    due_date: Optional[date] = None
    latest_payment: Optional[dict] = None
    updated_at: Optional[datetime] = None
```

**Query parameters** — Consistent pagination/search model:
```python
class QueryParameters(BaseModel):
    page: Optional[int] = 1
    limit: Optional[int] = 100
    search: Optional[str] = None
```

---

### 4.15 CORS Configuration

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],      # Restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

## 5. Technical Highlights

### 5.1 Eager Loading (N+1 Prevention)

All list queries use `selectinload` to load related entities in a single batch:

```python
# Room query with eager loading (prevents N+1)
db.query(Room).options(
    selectinload(Room.tenant),
    selectinload(Room.invoices).selectinload(Invoice.payments)
)

# Tenant query with nested eager loading
db.query(Tenant).options(
    selectinload(Tenant.room),
    selectinload(Tenant.invoices).selectinload(Invoice.payments)
)

# Invoice query with three-level eager loading
db.query(Invoice).options(
    selectinload(Invoice.room),
    selectinload(Invoice.tenant),
    selectinload(Invoice.payments)
)
```

### 5.2 Dependency Injection

FastAPI's `Depends()` cleanly wires database sessions, authentication, and authorization:

```python
# Single endpoint with three dependencies
@invoice_router.get("/{invoice_id}")
def get_invoice(
    invoice_id: int,
    db: Session = Depends(get_db),                                        # DB session
    current_user=Depends(PermissionGuard.allow_roles("admin", "staff", "tenant")),  # AuthZ
):
    ...
```

### 5.3 Transaction Safety

Every route that modifies data follows the same pattern:

```
try:
    result = Service.method(db, ...)
    db.commit()
    ...
except ValueError as e:
    db.rollback()
    raise HTTPException(status_code=400, detail=str(e))
except Exception as e:
    db.rollback()
    raise HTTPException(status_code=500, detail=str(e))
```

### 5.4 Misfire Recovery

Scheduled jobs include `misfire_grace_time` — if the server was offline during a scheduled run, the job will still execute within the grace window after restart:

- Monthly billing: 1 hour grace
- Late fees: 30 minutes grace

### 5.5 Idempotent Invoice Generation

The `generate_invoice` function checks for existing invoices by `(tenant_id, year, month)` before creating. If one already exists, it returns the existing record — safe to call multiple times.

---

## 6. Future Work

| Area | Proposed Enhancement |
|---|---|
| **Audit Logging** | Extend beyond login to track CRUD operations, failed logins, payment modifications, and role changes |
| **Notifications** | Email/SMS alerts for invoice issuance, payment confirmations, late-fee warnings, and monthly statements |
| **Multi-Property** | Add building/property entity with tenant isolation per property |
| **Analytics** | Dashboard with revenue trends, occupancy rates, average collection time, and exportable reports (CSV/PDF) |
| **Scheduler** | Persistent job store (database-backed), operational monitoring, and failure alerting |
| **Backup** | Automated database backup with pg_dump and restore workflows |
| **API Security** | Rate limiting, API key management, and CORS domain restriction for production |
| **Performance** | Redis caching for frequently accessed room/tenant data |

---

## 7. Conclusion

The Room Management API provides a comprehensive, production-ready backend for rental property operations. Its key strengths are:

1. **Structured data integrity** — Six well-normalized tables with foreign keys, check constraints, unique constraints, and composite indexes ensure data consistency at the database level.
2. **Layered architecture** — Clean separation between routes, services, and models makes the codebase maintainable and testable.
3. **Enterprise security** — Argon2 password hashing, JWT-based authentication, role-based access control, and data isolation for tenants.
4. **Operational automation** — APScheduler-driven monthly billing and daily late-fee processing eliminate manual recurring tasks.
5. **Comprehensive audit trail** — Structured security logging with rotating file storage provides visibility into authentication events.
6. **Business intelligence** — Built-in reports for payment collection rates, late payers, and room payment status.
7. **Developer experience** — Interactive OpenAPI docs (Swagger + ReDoc), CLI seeder, Docker Compose setup, and Alembic migrations.

The system is deployed and ready for core rental management operations, with a clear path for incremental enhancement without architectural friction.
