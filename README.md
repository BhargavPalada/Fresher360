# Fresher360

Fresher360 is a full-stack Fresher & User Management platform built with **FastAPI**, **PostgreSQL**, **React 19**, **TypeScript**, **Redux Toolkit (RTK Query)**, and **Material UI (MUI)**. It features role-based access control (`ADMIN` & `USER`), secure JWT dual-token authentication with `HttpOnly` refresh cookies, Argon2id password hashing, a responsive collapsible dashboard layout, and an **Admin Users Management** module with real-time role toggles and account creation.

---

## ✨ Features Implemented

### 1. 🔐 Authentication & Session Security
- **Dual-Token JWT Architecture**:
  - **Access Token (15 min)**: Kept strictly in Redux in-memory state (never stored in `localStorage` to prevent XSS attacks). Sent via `Authorization: Bearer <token>` on all protected APIs.
  - **Refresh Token (7 days)**: Stored in a secure `HttpOnly`, `SameSite=Lax` browser cookie (inaccessible to JavaScript).
- **Silent Re-Authentication**:
  - Frontend RTK Query interceptor (`baseQueryWithReauth`) automatically detects `401 Unauthorized`, calls `/api/v1/auth/refresh`, updates the in-memory access token, and retries the failed request seamlessly.
- **Argon2id Password Hashing**:
  - Industry-standard password hashing with individual salts for all passwords.
- **Public Registration & Seeded Logins**:
  - Self-serve registration modal on the login page for new users.
  - Pre-seeded admin and fresher accounts ready for demo.

### 2. 👥 Admin Users Management
- **Live Database Integration**:
  - Replaced hardcoded mock data with live PostgreSQL queries.
- **Interactive User List**:
  - Search filter by name or email.
  - User status chips (`Active` / `Inactive`).
  - Direct role selector dropdown (`ADMIN` vs `USER`) with instant API mutation (`PATCH /api/v1/users/admin/{user_id}/role`).
- **Add User Modal**:
  - Admin modal to create new user accounts directly (`POST /api/v1/users/admin/create`) with role assignment and Zod form validation.

### 3. 🎨 UI & Dashboard Design
- Fully responsive collapsible sidebar navigation built with Material UI.
- Dark / light slate color palette with distinct branding for Admin (`/admin`) and Fresher (`/user`) views.
- Global exception handling preserving CORS headers across all endpoints.

---

## 📋 Prerequisites

| Tool | Minimum Version | Check Command | Download / Install Link |
| :--- | :--- | :--- | :--- |
| **Node.js** | `v20.19+` or `v22.12+` | `node -v` | [nodejs.org](https://nodejs.org/) |
| **npm** | `v10+` | `npm -v` | Bundled with Node.js |
| **Python** | `3.11+` | `python --version` | [python.org](https://www.python.org/downloads/) |
| **Docker & Docker Compose** | Latest *(Recommended)* | `docker --version` | [Docker Desktop](https://www.docker.com/products/docker-desktop/) |
| **PostgreSQL** *(if running locally)* | `16+` | `psql --version` | [postgresql.org](https://www.postgresql.org/download/) |
| **Git** | `2.x+` | `git --version` | [git-scm.com](https://git-scm.com/) |

---

## 🌐 Dedicated Service Ports

Each service runs on its own dedicated port:

| Service | Dedicated Port | Access URL |
| :--- | :--- | :--- |
| **Frontend Web App** | `5173` | [http://localhost:5173](http://localhost:5173) |
| **Backend API** | `8000` | [http://localhost:8000](http://localhost:8000) (Docs at `/api/docs`) |
| **PostgreSQL Database** | `5432` *(or `5433`)* | `localhost:5432` |

> [!NOTE]
> If your Windows machine has a local PostgreSQL service running on port `5432`, Docker can map to host port `5433:5432` to prevent port collisions.

---

## 🚀 Step-by-Step Running Guide

### Method A: Running with Docker Compose (Recommended)

Docker Compose starts PostgreSQL, runs database migrations, seeds initial users, and spins up both the FastAPI backend and Vite frontend automatically.

#### 1. Clone the repository
```bash
git clone https://github.com/BhargavPalada/Fresher360.git
cd Fresher360
```

#### 2. Configure Environment Variables
Copy the backend environment file:
```bash
# Windows PowerShell
copy backend\.env.example backend\.env

# macOS / Linux
cp backend/.env.example backend/.env
```

#### 3. Start All Containers
Ensure **Docker Desktop** is running, then execute:
```bash
docker compose up --build -d
```

#### 4. Verify Services
Check container status:
```bash
docker compose ps
```
- **PostgreSQL**: port `5432` (or `5433` if custom mapped)
- **Backend API**: `http://localhost:8000`
- **Frontend App**: `http://localhost:5173`

#### 5. Stop Containers
```bash
docker compose down
```

---

### Method B: Running Locally (Native Development)

#### 1. Start the Database
Ensure PostgreSQL is running. If using Docker just for the database:
```bash
docker compose up -d db
```

---

#### 2. Backend Setup (`FastAPI`)

##### Step 2.1: Navigate and create a virtual environment
```bash
cd backend
python -m venv .venv
```

##### Step 2.2: Activate the virtual environment
- **Windows (PowerShell)**:
  ```powershell
  .venv\Scripts\Activate.ps1
  ```
- **macOS / Linux**:
  ```bash
  source .venv/bin/activate
  ```

##### Step 2.3: Install backend dependencies
```bash
pip install -r requirements.txt
```

##### Step 2.4: Configure `backend/.env`
Ensure your `backend/.env` file contains valid credentials:
```env
DATABASE_URL=postgresql+psycopg://postgres:postgres@localhost:5432/fresher360

JWT_SECRET=d10ec919d423a56ca6ef8a5187f80c705dc948d93d43e3a52b60c8e4786d08b05baf2278365991f2ecbca4c88467b5672a1357801c6c413c04e5b57532d3c1ee
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=15

JWT_REFRESH_SECRET=ccb2ec2238b756779118b2acff29ae957f35802495b6e437268fa74cd4ba1da4e513ff958513fbe3eef55f14c1a105b4b4f92b20ff77d33eefa92b9d06ce06f0
REFRESH_TOKEN_EXPIRE_DAYS=7

CORS_ALLOWED_ORIGINS=["http://localhost:5173", "http://127.0.0.1:5173"]

SEED_ADMIN_EMAIL=admin@fresher360.com
SEED_ADMIN_PASSWORD=Admin@1234!
SEED_ADMIN_FIRST_NAME=Admin
SEED_ADMIN_LAST_NAME=User

SEED_USER_EMAIL=user@fresher360.com
SEED_USER_PASSWORD=User@1234!
SEED_USER_FIRST_NAME=John
SEED_USER_LAST_NAME=Doe
```

##### Step 2.5: Run database migrations
```bash
alembic upgrade head
```

##### Step 2.6: Seed initial admin and test users
```bash
python scripts/seed.py
```

##### Step 2.7: Launch the FastAPI server
```bash
uvicorn app.main:app --reload --port 8000
```
API server will be running at `http://127.0.0.1:8000`.

---

#### 3. Frontend Setup (`React + Vite`)

Open a new terminal window:

##### Step 3.1: Navigate and install dependencies
```bash
cd frontend
npm install
```

##### Step 3.2: Start the Vite development server
```bash
npm run dev
```
Frontend application will be running at `http://localhost:5173`.

---

## 🔑 Default Seed Credentials

| Role | Email | Password | Landing Page | Accessible Features |
| :--- | :--- | :--- | :--- | :--- |
| **Administrator** | `admin@fresher360.com` | `Admin@1234!` | `/admin` | Users Management (`/admin/users`), Role Editing, Add Users |
| **Fresher / User** | `user@fresher360.com` | `User@1234!` | `/user` | Fresher Dashboard & Profile |

---

## 📡 REST API Catalog

| Method | Endpoint | Access / Auth | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/auth/login` | Public | Authenticates credentials; returns Access Token & sets HttpOnly Refresh cookie |
| `POST` | `/api/v1/auth/register` | Public | Registers a new Fresher account; returns Access Token & Refresh cookie |
| `POST` | `/api/v1/auth/refresh` | Cookie (`refresh_token`) | Issues a new 15-minute Access Token |
| `POST` | `/api/v1/auth/logout` | Protected (`Bearer`) | Clears refresh cookie and logs out |
| `GET` | `/api/v1/auth/me` | Protected (`Bearer`) | Retrieves current authenticated user profile & role |
| `GET` | `/api/v1/users/admin/list` | Admin (`Bearer`) | Returns list of all users from database |
| `PATCH` | `/api/v1/users/admin/{user_id}/role` | Admin (`Bearer`) | Updates user role (`ADMIN` or `USER`) |
| `POST` | `/api/v1/users/admin/create` | Admin (`Bearer`) | Creates new user account directly by Admin |
| `GET` | `/health` | Public | Healthcheck endpoint (`{"status": "ok"}`) |

---

## 🧪 Automated Testing Suite

### Backend Tests (`pytest`)
From the `backend` folder:
```bash
pytest
```
* **39 unit & integration tests** passing:
  - JWT token generation, claims, and verification
  - Argon2 password hashing and salt verification
  - Login use case, credential validation, and failure scenarios
  - Registration use case and email uniqueness checks
  - Admin Users API (`GET /list`, `PATCH /role`, `POST /create`, and unauthorized access blocks)

### Frontend Tests (`vitest`)
From the `frontend` folder:
```bash
npm test
```
* **11 unit & component tests** passing:
  - `LoginForm`: input validation, password toggle, submission, and error display
  - `RegisterModal`: validation rules and account creation modal flow
  - `UserListTable`: role selector dropdown, search filtering, and user list rendering

### TypeScript Compilation Check
From the `frontend` folder:
```bash
npm run build
```
* Zero compilation errors (`tsc -b`).

---

## 🛠️ Common Troubleshooting

### 1. "password authentication failed for user 'postgres'"
- **Cause**: Port `5432` is occupied by a local PostgreSQL service installed on Windows with a different password than Docker's `postgres:postgres`.
- **Solution**:
  - Option A: Stop the local Windows PostgreSQL service (`Stop-Service postgresql-x64-18`).
  - Option B: Use port `5433` in `docker-compose.yml` (`5433:5432`) and set `DATABASE_URL=localhost:5433` in `backend/.env`.

### 2. "CORS policy: No 'Access-Control-Allow-Origin' header"
- Starlette/FastAPI raises unhandled 500 errors outside CORS middleware if not handled. A global 500 exception handler is configured in `backend/app/main.py` so the exact error message is returned as JSON with CORS headers.
- Check backend console logs to inspect the error stack trace.

---

## 📁 Project Architecture

```text
Fresher360/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── dependencies/    # Auth & Admin JWT route guards
│   │   │   ├── v1/              # FastAPI routers (/auth, /users)
│   │   │   └── router.py        # Central API v1 router
│   │   ├── application/         # Use cases (login, refresh, register, users)
│   │   ├── domain/              # Entities, enums (UserRole: ADMIN, USER)
│   │   ├── infrastructure/      # DB models, SqlAlchemy repos, JWT & Argon2 services
│   │   ├── schemas/             # Pydantic request/response schemas
│   │   ├── config.py            # Pydantic BaseSettings (.env loader)
│   │   └── main.py              # FastAPI factory, CORS, exception handlers
│   ├── migrations/              # Alembic migration versions
│   ├── scripts/                 # DB seed script (scripts/seed.py)
│   └── tests/                   # Pytest suite (39 tests: unit + integration)
│
├── frontend/
│   ├── src/
│   │   ├── app/                 # Redux store & React Router configuration
│   │   ├── features/
│   │   │   ├── auth/            # Auth state, RTK Query API, hooks
│   │   │   │   └── components/
│   │   │   │       ├── login/   # LoginForm & RegisterModal
│   │   │   │       └── DashboardLayout.tsx
│   │   │   └── users/           # Admin Users Management feature
│   │   │       ├── api/         # usersApi (RTK Query: list, role update, create)
│   │   │       ├── components/  # UserListTable & AddUserModal
│   │   │       └── types/       # AdminUser & payload TypeScript interfaces
│   │   ├── pages/               # Route pages (LoginPage, AdminHomePage, UserHomePage)
│   │   ├── services/api/        # baseApi with baseQueryWithReauth
│   │   └── index.css            # Global CSS tokens & styles
│   └── package.json
│
└── docker-compose.yml           # Multi-container orchestration (db, backend, frontend)
```