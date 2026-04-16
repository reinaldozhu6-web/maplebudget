# MapleBudget

MapleBudget is a full-stack personal finance workspace for tracking income,
expenses, spending categories, monthly budgets, and dashboard health. It pairs a
FastAPI backend with a Vite React frontend so users can register, sign in, record
money movement, and see the current month's budget picture in one place.

## What It Does

- Secure account registration and JWT-based login.
- Category management for income and expense groups.
- Transaction tracking with create, list, edit, delete, date, note, type, and
  optional category assignment.
- Monthly budget tracking for overall budgets or category-specific budgets.
- Dashboard analytics for current-month income, expenses, net balance, spending
  by category, recent transactions, and budget progress.
- User-scoped data access so budgets, categories, and transactions stay attached
  to the authenticated account.
- Local SQLite setup by default, with PostgreSQL support through `DATABASE_URL`.

## Tech Stack

| Area | Tools |
| --- | --- |
| Backend | FastAPI, SQLAlchemy, Alembic, Pydantic, python-jose, passlib |
| Frontend | React 19, Vite 7, Tailwind CSS, local shadcn/ui-style components |
| Database | SQLite for local development, PostgreSQL-ready configuration |
| Testing | Pytest, HTTPX, Playwright |

## Repository Layout

```text
backend/
  app/
    api/          FastAPI route modules
    core/         settings, database, and security helpers
    models/       SQLAlchemy database models
    schemas/      Pydantic request and response schemas
  alembic/        migration environment and version files
  tests/          backend API and data-isolation tests

frontend/
  src/            React application, API client, styles, and UI components
  tests/e2e/      Playwright browser flows
  package.json    frontend scripts and dependencies
```

## Product Surface

The application includes these authenticated screens:

- **Dashboard**: current-month summary cards, category spending, budget progress,
  recent transactions, and budget risk indicators.
- **Transactions**: create, filter, edit, and delete income or expense records.
- **Budgets**: create, filter, edit, and delete monthly budget targets.
- **Categories**: create and view income and expense categories.

The backend exposes matching API modules for auth, categories, transactions,
budgets, and dashboard reporting. Interactive OpenAPI docs are available at
`http://127.0.0.1:8000/docs` when the backend is running.

## Prerequisites

- Python 3.11 or newer
- Node.js 20 or newer
- npm

The commands below use Windows PowerShell from the repository root.

## Backend Setup

Create a virtual environment and install the backend dependencies:

```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r backend\requirements.txt
```

Optionally copy the backend environment example:

```powershell
Copy-Item backend\.env.example backend\.env
```

If `backend/.env` is not present, the backend uses local defaults.

| Variable | Default | Purpose |
| --- | --- | --- |
| `APP_NAME` | `MapleBudget API` | API application name |
| `DATABASE_URL` | `sqlite:///./maplebudget.db` | SQLAlchemy database URL |
| `SECRET_KEY` | `change-this-in-production` | JWT signing key |
| `ALGORITHM` | `HS256` | JWT signing algorithm |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `60` | Access token lifetime |

Example local configuration:

```text
DATABASE_URL=sqlite:///./maplebudget.db
SECRET_KEY=replace-this-for-local-development
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
```

PostgreSQL can be used by changing `DATABASE_URL`:

```text
DATABASE_URL=postgresql://user:password@localhost:5432/maplebudget
```

Apply database migrations:

```powershell
python -m alembic -c backend\alembic.ini upgrade head
```

Start the API:

```powershell
python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
```

Useful backend URLs:

```text
Health check: http://127.0.0.1:8000
API docs:     http://127.0.0.1:8000/docs
```

## Frontend Setup

Install the frontend dependencies:

```powershell
cd frontend
npm install
```

Optionally copy the frontend environment example:

```powershell
Copy-Item .env.example .env
```

The frontend reads one environment variable:

| Variable | Default | Purpose |
| --- | --- | --- |
| `VITE_API_BASE_URL` | `http://127.0.0.1:8000` | Backend API base URL |

Start the Vite dev server:

```powershell
npm run dev
```

Open:

```text
http://127.0.0.1:5173
```

## Local Development Workflow

Terminal 1:

```powershell
.\venv\Scripts\Activate.ps1
python -m alembic -c backend\alembic.ini upgrade head
python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
```

Terminal 2:

```powershell
cd frontend
npm run dev
```

Then open `http://127.0.0.1:5173`.

## Testing

Run the backend test suite:

```powershell
.\venv\Scripts\Activate.ps1
python -m pytest backend
```

Build the frontend:

```powershell
cd frontend
npm run build
```

Run Playwright end-to-end tests:

```powershell
cd frontend
npm run test:e2e
```

The Playwright suite expects both servers to already be running:

```text
Frontend: http://127.0.0.1:5173
Backend:  http://127.0.0.1:8000
```

Open the Playwright UI runner:

```powershell
cd frontend
npm run test:e2e:ui
```

## API Coverage

The backend test suite covers:

- registration, login, duplicate-user handling, and authenticated user lookup;
- authenticated category creation/listing and duplicate category protection;
- transaction creation, listing, retrieval, updates, deletion, validation, and
  user isolation;
- budget creation, listing, retrieval, updates, deletion, duplicate protection,
  validation, and user isolation;
- dashboard totals, spending by category, budget progress, and auth guards.

## Current Scope

Implemented:

- Full auth flow with protected frontend routes.
- Category creation/listing.
- Transaction create/list/edit/delete.
- Budget create/list/edit/delete.
- Dashboard summary, spending by category, budget progress, recent transactions,
  and budget risk panels.
- Alembic migrations for users, categories, transactions, and budgets.
- Backend unit/API tests and browser-level stable-flow tests.

Not implemented yet:

- Category edit/delete.
- Multi-currency conversion.
- Production deployment configuration.

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE).
