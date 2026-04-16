# MapleBudget Frontend

The frontend is a Vite React app styled with Tailwind CSS and local
shadcn/ui-style components.

## Setup

```powershell
npm install
```

## Environment

Copy the example file if you need to override the backend URL:

```powershell
Copy-Item .env.example .env
```

Supported variable:

```text
VITE_API_BASE_URL=http://127.0.0.1:8000
```

## Run

```powershell
npm run dev
```

Open:

```text
http://127.0.0.1:5173
```

## Build

```powershell
npm run build
```

See the repository root README for full backend, migration, and test commands.
