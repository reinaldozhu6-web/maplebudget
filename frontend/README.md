# MapleBudget Frontend

## Local Setup

Install dependencies:

```powershell
cd frontend
npm install
```

Run the frontend:

```powershell
npm run dev
```

The app defaults to this backend URL:

```text
http://127.0.0.1:8000
```

To override it, create `frontend/.env`:

```text
VITE_API_BASE_URL=http://127.0.0.1:8000
```
