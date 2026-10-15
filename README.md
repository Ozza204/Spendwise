# SpendWise

React, TypeScript, Vite and FastAPI foundation for a personal finance web app.
The existing Supabase PostgreSQL tables and RLS policies are not managed here.

## Requirements

- Node.js and npm (see Vite's supported Node.js versions)
- Python 3.10 or newer

## Backend

In PowerShell, from the repository root:

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

Open http://127.0.0.1:8000/health to see `{"status":"ok"}`.

## Frontend

In a second PowerShell terminal, from the repository root:

```powershell
cd frontend
npm install
if (-not (Test-Path .env.local)) { Copy-Item .env.example .env.local }
npm run dev
```

Open http://localhost:5173. Vite forwards `/api` requests to FastAPI at `http://127.0.0.1:8000`. The FastAPI health endpoint remains available at `/api/health` through Vite.

## Supabase setup

Replace the placeholders in `frontend/.env.local` with your existing project's **base URL** (for example, `https://your-project.supabase.co`, without `/rest/v1`) and **publishable** API key from Supabase. Vite exposes `VITE_` variables in browser code, so never put a Supabase secret key, service role key, or database password there. Local `.env` files are ignored by Git. Restart Vite after editing one.

`frontend/src/lib/supabase.ts` creates the browser client from these variables. SpendWise now supports signup, email confirmation, login, logout and persistent browser sessions. The main page requires a session and loads the user's existing `public."Users"` profile or creates one with their username from Auth metadata. It does not store passwords in the application tables.

In the Supabase dashboard:

1. Check **Authentication → Providers → Email**. Enable email/password signup and choose whether email confirmation is required.
2. Set **Authentication → URL Configuration → Site URL** to your app URL. Add the development URLs you use, such as `http://localhost:5173/**` and `http://127.0.0.1:5173/**`, to **Redirect URLs** so confirmation links can return to the app. Add the deployed URL when available.
3. Confirm that `public."Users"` is exposed to the Data API for authenticated clients, that its existing RLS policies permit users to select and insert only their own row, and that `user_id` has a unique or primary-key constraint. Profile creation uses `ON CONFLICT (user_id) DO NOTHING` to preserve existing usernames and prevent duplicate rows.
4. If confirmation emails must reach addresses outside your Supabase team's approved addresses, configure custom SMTP.

The frontend uses Supabase directly for authentication and profile access. The FastAPI backend does not handle passwords or sessions yet. Banking and spending features are still out of scope.

## Manual auth check

Sign up with a dedicated test email and username. If confirmation is enabled, follow the email link. Sign in and confirm the username appears on the home page, refresh to check session persistence, then sign out and confirm the login page appears. In the Supabase dashboard, check that `public."Users"` has one row for the test user's `user_id`; signing in again should leave the same username and row count.
