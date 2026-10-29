# Waste Not, Want Not
Food waste control and cost-saving system for hotel kitchens. Stack: React (Vite) + Tailwind, Express, MongoDB (Mongoose), JWT login.

What it does: kitchen staff log waste (item, weight, station, shift, reason); the system works out cost, shows trends against a monthly budget, finds the biggest causes and gives action steps with estimated savings. Managers can delete entries, set the budget and export CSV.

## Run locally
1. `cd backend && cp .env.example .env` (fill in MONGODB_URI), then `npm install && npm run dev` (port 5000).
2. `cd frontend && cp .env.example .env && npm install && npm run dev` (port 5173).
3. Demo logins (change them in `.env`): manager@wastenot.com / Manager@123 and chef@wastenot.com / Chef@123. 45 days of sample data are created on first start. Set `SEED_DEMO=false` to skip it.

## Deploy on Vercel (two projects, same repo)
- Backend: root `backend`. Env: MONGODB_URI, JWT_SECRET, CLIENT_URL, MANAGER_EMAIL, MANAGER_PASSWORD, STAFF_EMAIL, STAFF_PASSWORD. Atlas Network Access must allow 0.0.0.0/0.
- Frontend: root `frontend`. Env: `VITE_API_URL=https://<your-backend>.vercel.app/api`. Redeploy after changing env vars.
- Check `<backend-url>/api/health` first.
