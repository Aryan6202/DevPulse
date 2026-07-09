# DevPulse

DevPulse is an internal dashboard that tracks developer learning progress —
bios, skills, and skill-level progress — and blends in a live feed of each
developer's most recently updated GitHub repositories. Built as a full MERN
(MongoDB, Express, React, Node.js) application with TypeScript on the frontend.

## Tech Stack

**Backend**
- Node.js + Express — REST API
- MongoDB + Mongoose — data + schema validation
- JWT (jsonwebtoken) — authentication
- bcryptjs — password hashing
- helmet, cors, express-rate-limit — security hardening
- node-fetch — server-side GitHub API calls

**Frontend**
- React 18 + TypeScript
- Vite — build tooling and dev server
- CSS Grid (dashboard layout) + Flexbox (navigation) + media queries (responsive)
- React.lazy / Suspense — code-splitting for performance

**Infrastructure**
- MongoDB Atlas — hosted database
- Render — backend API hosting
- Vercel — frontend hosting

## Features

- Register/login with hashed passwords and JWT-protected routes
- Create and update a profile: bio + list of skills (name, level, progress %)
- Live GitHub feed showing a user's 3 most recently updated repositories
- Fully responsive dashboard (desktop grid collapses to a single column on mobile)
- Type-safe frontend via shared TypeScript interfaces
- Lazy-loaded GitHub feed component for a faster initial page load

## Project Structure

```
devpulse/
├── backend/
│   ├── src/
│   │   ├── config/db.js          # MongoDB connection
│   │   ├── models/UserProfile.js # Mongoose schema
│   │   ├── middleware/auth.js    # JWT verification
│   │   ├── routes/auth.js        # register / login
│   │   ├── routes/profile.js     # GET/POST profile (bio + skills)
│   │   ├── routes/github.js      # GitHub API proxy
│   │   └── server.js             # Express app entry point
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── api/client.ts         # typed fetch wrapper
│   │   ├── context/AuthContext.tsx
│   │   ├── components/           # ProfileHeader, SkillCards, GitHubFeed, AuthForm
│   │   ├── styles/                # CSS Grid/Flexbox + media queries
│   │   ├── types/index.ts        # shared TypeScript interfaces
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── .env.example
│   ├── vercel.json
│   └── package.json
├── render.yaml
├── INTEGRATION.md
├── PERFORMANCE.md
└── README.md
```

## Local Installation

### Prerequisites
- Node.js 18+
- A MongoDB connection string (a free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster works)

### 1. Clone and install
```bash
git clone <your-fork-url> devpulse
cd devpulse

# Backend
cd backend
npm install
cp .env.example .env   # fill in MONGO_URI and JWT_SECRET

# Frontend
cd ../frontend
npm install
cp .env.example .env   # defaults to http://localhost:5000/api
```

### 2. Run in development
Open two terminals:
```bash
# Terminal 1 - backend
cd backend
npm run dev        # starts on http://localhost:5000

# Terminal 2 - frontend
cd frontend
npm run dev         # starts on http://localhost:5173
```
Visit `http://localhost:5173` in your browser.

### 3. Build for production
```bash
cd frontend
npm run build        # outputs to frontend/dist
```

## Deployment

### Backend → Render
1. Push this repo to GitHub.
2. In Render, create a new **Web Service**, point it at the repo, and set the
   root directory to `backend` (or use the included `render.yaml` for
   one-click config via a Blueprint).
3. Add environment variables in the Render dashboard: `MONGO_URI`,
   `JWT_SECRET`, `JWT_EXPIRES_IN`, `CLIENT_ORIGIN` (your Vercel URL),
   `GITHUB_TOKEN` (optional).
4. Deploy. Render will run `npm install` then `npm start`.

### Frontend → Vercel
1. In Vercel, import the same repo and set the root directory to `frontend`.
2. Set the environment variable `VITE_API_URL` to your Render backend URL
   plus `/api` (e.g. `https://devpulse-api.onrender.com/api`).
3. Deploy — Vercel auto-detects Vite via the included `vercel.json`.

### Database → MongoDB Atlas
1. Create a free cluster at MongoDB Atlas.
2. Add a database user and allow network access from Render's IPs (or `0.0.0.0/0` for simplicity).
3. Copy the connection string into `MONGO_URI` on Render.

## API Reference

| Method | Endpoint                       | Auth | Description                          |
|--------|----------------------------------|------|---------------------------------------|
| POST   | `/api/auth/register`            | No   | Create an account                     |
| POST   | `/api/auth/login`                | No   | Log in, receive a JWT                 |
| GET    | `/api/profile/:username`         | No   | Public profile lookup                 |
| GET    | `/api/profile/me/data`           | Yes  | Get your own profile                  |
| POST   | `/api/profile/me/data`           | Yes  | Update bio / skills / GitHub username |
| GET    | `/api/github/:username/repos`    | No   | Latest 3 repos for a GitHub username  |
| GET    | `/api/health`                    | No   | Health check                          |

Authenticated requests must include `Authorization: Bearer <token>`.

## Git Workflow

This project was built using feature branches merged into `main`:
- `feature/auth` — JWT + bcrypt security layer
- `feature/frontend-ui` — React/TS scaffold, components, responsive layout, lazy loading
- `feature/api-integration` — CORS, env vars, GitHub proxy, deploy configs
- `feature/optimization` — performance notes and Core Web Vitals improvements

## Further Reading
- [`INTEGRATION.md`](./INTEGRATION.md) — how the frontend and backend are wired together
- [`PERFORMANCE.md`](./PERFORMANCE.md) — optimization decisions and next steps
