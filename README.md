# MapleBudget

MapleBudget is a personal finance web app for tracking income, expenses,
categories, monthly budgets, and dashboard analytics.

## Stack

- Backend: FastAPI, SQLAlchemy, Alembic, Pydantic
- Frontend: Vite, React, Tailwind CSS, shadcn/ui-style local components
- Default local database: SQLite at `maplebudget.db`
- Production database target: PostgreSQL via `DATABASE_URL`

## Project Layout

```text
backend/
  app/
    api/          FastAPI routers
    core/         settings, database, security helpers
    models/       SQLAlchemy models
    schemas/      Pydantic request/response schemas
  alembic/        migration environment and versions
  tests/          backend pytest suite
frontend/
  src/            React app, API client, styles, UI components
  package.json    frontend scripts and dependencies
```

## Prerequisites

- Python 3.11 or newer
- Node.js 20 or newer
- npm

Windows PowerShell examples are used below because the project is currently being
developed on Windows.

## Backend Setup

From the repository root:

```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r backend\requirements.txt
```

Create an optional backend environment file:

```powershell
Copy-Item backend\.env.example backend\.env
```

If `backend/.env` is absent, the backend uses the defaults documented below.

## Backend Environment Variables

The backend reads `backend/.env`.

| Variable | Default | Description |
| --- | --- | --- |
| `APP_NAME` | `MapleBudget API` | API application name. |
| `DATABASE_URL` | `sqlite:///./maplebudget.db` | SQLAlchemy database URL. |
| `SECRET_KEY` | `change-this-in-production` | JWT signing key. Change this outside local development. |
| `ALGORITHM` | `HS256` | JWT signing algorithm. |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `60` | Access token lifetime in minutes. |

Example `backend/.env`:

```text
DATABASE_URL=sqlite:///./maplebudget.db
SECRET_KEY=replace-this-for-shared-or-production-environments
ACCESS_TOKEN_EXPIRE_MINUTES=60
```

For PostgreSQL:

```text
DATABASE_URL=postgresql://user:password@localhost:5432/maplebudget
```

## Database Migrations

Run migrations from the repository root with the virtual environment active:

```powershell
python -m alembic -c backend\alembic.ini upgrade head
```

Create a new migration after model changes:

```powershell
python -m alembic -c backend\alembic.ini revision --autogenerate -m "describe change"
```

Inspect current migration state:

```powershell
python -m alembic -c backend\alembic.ini current
python -m alembic -c backend\alembic.ini history
```

## Start The Backend

From the repository root with the virtual environment active:

```powershell
python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
```

Health check:

```text
http://127.0.0.1:8000
```

Interactive API docs:

```text
http://127.0.0.1:8000/docs
```

## Frontend Setup

From the repository root:

```powershell
cd frontend
npm install
```

Create an optional frontend environment file:

```powershell
Copy-Item .env.example .env
```

## Frontend Environment Variables

The frontend reads `frontend/.env`.

| Variable | Default | Description |
| --- | --- | --- |
| `VITE_API_BASE_URL` | `http://127.0.0.1:8000` | Backend API base URL used by the React app. |

Example `frontend/.env`:

```text
VITE_API_BASE_URL=http://127.0.0.1:8000
```

## Start The Frontend

From `frontend/`:

```powershell
npm run dev
```

Open:

```text
http://127.0.0.1:5173
```

Build production assets:

```powershell
npm run build
```

Preview a production build:

```powershell
npm run preview
```

## Test Commands

Backend tests:

```powershell
.\venv\Scripts\Activate.ps1
python -m pytest backend
```

Frontend build verification:

```powershell
cd frontend
npm run build
```

There are no frontend end-to-end tests yet.

## Common Local Workflow

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

## Current Product Scope

Implemented:

- User registration, login, and current-user session check
- Category create/list
- Transaction create/list/edit/delete
- Budget create/list/edit/delete
- Dashboard summary, spending by category, budget progress, recent transactions,
  and budget risk panels

Not implemented yet:

- Category edit/delete
- Multi-currency conversion
- Frontend end-to-end tests
- Production deployment configuration
