# DevPulse 🚀

DevPulse is a modern, high-performance internal developer dashboard designed to consolidate developer bios, technical skill progress, and live GitHub activity feeds in a single responsive interface. 

The application is built using a complete MERN stack (MongoDB, Express, React, Node.js) with TypeScript on the frontend. It features robust token-based authentication, security hardening, optimized page-load performance through lazy loading and code splitting, and a fully production-ready configuration for cloud deployment.

---

## Table of Contents
1. [Key Features](#key-features)
2. [Tech Stack & Architecture Rationale](#tech-stack--architecture-rationale)
3. [Project Directory Structure](#project-directory-structure)
4. [Local Setup & Installation](#local-setup--installation)
5. [API Reference](#api-reference)
6. [Security Hardening](#security-hardening)
7. [Performance Optimizations](#performance-optimizations)
8. [Step-by-Step Production Deployment](#step-by-step-production-deployment)
   - [1. Database: MongoDB Atlas](#1-database-mongodb-atlas)
   - [2. Backend: API on Render](#2-backend-api-on-render)
   - [3. Frontend: On Vercel](#3-frontend-on-vercel)
9. [Git Workflow](#git-workflow)

---

## Key Features

- **Secure Member Authentication**: Session-based security using JSON Web Tokens (JWT) with secure password hashing via `bcryptjs`.
- **Dynamic Skill Progress**: Allows developers to maintain and update a professional bio and a list of skills, featuring name, mastery level, and progress percentages depicted visually with dynamic progress indicators.
- **Proxy GitHub Activity Feed**: A backend proxy route that securely connects with the GitHub REST API to fetch and render the developer's 3 most recently updated public repositories, preventing browser-side API key leakage and routing around client-side rate limits.
- **Premium User Interface**: Implements a glassmorphic aesthetic using a custom, high-contrast, modern color palette with CSS variables, custom Google Fonts (Outfit & Inter), smooth micro-animations, and hover states.
- **Fully Responsive Layout**: Built with CSS Grid and Flexbox, utilizing mobile-first design and CSS media queries. Desktop layouts collapse elegantly to a single-column flow on mobile viewports.
- **Type Safety**: Strictly typed interfaces shared across all components via TypeScript, providing robust compilation checks and editor autocomplete.

---

## Tech Stack & Architecture Rationale

### Frontend
- **React 18**: Chosen for its robust virtual DOM rendering, functional component design, and performance optimizations.
- **TypeScript**: Ensures compilation-time type checking, preventing runtime errors in profile schemas and API data parsing.
- **Vite**: Provides exceptionally fast development startup times, hot module replacement, and optimized production bundlers.
- **Vanilla CSS**: Provides zero-overhead, highly customizable styling. Leverages CSS Grid for structural layout and Flexbox for linear navigation. Avoids heavy utility classes for clean markup.

### Backend
- **Node.js & Express**: Provides a lightweight and highly non-blocking REST API structure.
- **Mongoose & MongoDB**: Documents-based NoSQL storage fits the developers' flexible profile schema where skill counts and metadata structures can vary.
- **jsonwebtoken (JWT)**: Ensures state-free, lightweight authorization tokens sent via headers.
- **express-rate-limit**: Secures endpoints (like auth routes) against brute-force script attempts.
- **Helmet**: Adds secure HTTP response headers (XSS protections, frameguard, etc.) automatically.

---

## Project Directory Structure

```
devpulse/
├── backend/
│   ├── src/
│   │   ├── config/db.js          # Mongoose database connection setup
│   │   ├── models/UserProfile.js # Mongoose User and Profile Schemas
│   │   ├── middleware/auth.js    # JWT validation middleware
│   │   ├── routes/auth.js        # Authentication endpoints (Register/Login)
│   │   ├── routes/profile.js     # Developer profile CRUD routes
│   │   ├── routes/github.js      # Proxy server route to the GitHub API
│   │   └── server.js             # Express application initialization & middleware
│   ├── .env.example              # Schema of environment variables for local dev
│   ├── vercel.json               # Serverless config if deploying backend to Vercel
│   └── package.json              # Backend dependencies and startup scripts
├── frontend/
│   ├── src/
│   │   ├── api/client.ts         # Typed Axios-like custom Fetch client
│   │   ├── context/AuthContext.tsx # Global React context state for auth
│   │   ├── components/           # Isolated components (ProfileHeader, SkillCards, etc.)
│   │   ├── styles/               # CSS Grid/Flexbox design tokens and themes
│   │   ├── types/index.ts        # Common TypeScript interfaces
│   │   ├── App.tsx               # Main Router and Suspense skeleton
│   │   └── main.tsx              # React client hydration entry point
│   ├── .env.example              # Schema of frontend configuration variables
│   ├── vercel.json               # SPA routing/rewrite rules for Vercel deployment
│   ├── vite.config.ts            # Vite compiler configuration
│   └── package.json              # Frontend libraries and build tooling
├── render.yaml                   # Infrastructure-as-Code Blueprint for Render
├── INTEGRATION.md                # Technical brief on client-server wiring
└── PERFORMANCE.md                # Details on optimization decisions
```

---

## Local Setup & Installation

### Prerequisites
- **Node.js** v18 or newer
- **npm** v9 or newer
- A **MongoDB** database instance (either local or a free Atlas instance)

### 1. Repository Setup & Dependencies
Clone the repository and install dependency groups for both applications:
```bash
git clone YOUR_REPOSITORY_URL devpulse
cd devpulse

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Configure Environment Variables
Create a `.env` file in the `backend` and `frontend` directories using the reference templates:

#### Backend Config (`backend/.env`)
```env
PORT=5002
NODE_ENV=development
MONGO_URI=mongodb+srv://YOUR_DB_USER:YOUR_DB_PASSWORD@cluster.mongodb.net/devpulse?retryWrites=true&w=majority
JWT_SECRET=your_super_secret_jwt_random_string
JWT_EXPIRES_IN=7d
CLIENT_ORIGIN=http://localhost:5173
GITHUB_TOKEN=your_optional_github_personal_access_token
```

#### Frontend Config (`frontend/.env`)
```env
VITE_API_URL=http://localhost:5002/api
```

### 3. Run in Development Mode
Start both services in separate terminal windows:

#### Terminal 1: Backend
```bash
cd backend
npm run dev
```
*Starts Express on `http://localhost:5002`.*

#### Terminal 2: Frontend
```bash
cd frontend
npm run dev
```
*Launches the Vite dev server on `http://localhost:5173`.*

---

## API Reference

All requests to protected endpoints require an authorization token provided in the header:
`Authorization: Bearer YOUR_JWT_TOKEN`

| Method | Endpoint | Auth Required | Description |
|:---|:---|:---:|:---|
| `POST` | `/api/auth/register` | No | Creates a user account and returns a JWT token. |
| `POST` | `/api/auth/login` | No | Authenticates user credentials and returns a JWT token. |
| `GET` | `/api/profile/:username` | No | Public endpoint to retrieve another developer's profile. |
| `GET` | `/api/profile/me/data` | **Yes** | Fetches the authenticated developer's profile. |
| `POST` | `/api/profile/me/data` | **Yes** | Updates or creates the developer's bio, skills, and GitHub username. |
| `GET` | `/api/github/:username/repos` | No | Fetches the 3 most recently updated public repositories of a user. |
| `GET` | `/api/health` | No | Returns basic API status and server uptime indicators. |

---

## Security Hardening

To ensure a production-grade security profile, the following layers are implemented:
1. **Password Encryption**: User passwords are encrypted prior to insertion into MongoDB using `bcryptjs` with a work factor of 10.
2. **CORS Restrictions**: The backend rejects requests coming from unauthorized sources using the `cors` package configured with variable origins from `CLIENT_ORIGIN`.
3. **HTTP Header Hardening**: Integrates `helmet` middleware to set essential security headers (such as Content Security Policy, XSS protections, HSTS, and clickjacking barriers).
4. **Rate Limiting**: Implements `express-rate-limit` on the authentication routes (`/api/auth/*`) to limit requests to 50 attempts per 15 minutes, preventing automated dictionary attacks.
5. **Data Limits**: The backend restricts incoming JSON payloads to `5mb` to defend against buffer overflow and denial of service (DoS) attempts.

---

## Performance Optimizations

1. **Lazy Loading Components**: The heavy `GitHubFeed` component is split using `React.lazy()` and `Suspense`, preventing it from blocking the initial render of the page.
2. **Vendor Chunk Splitting**: Configured Vite's rollup builder to split major modules (`react`, `react-dom`, `react-router-dom`) into a cached `vendor` chunk. This speeds up load times for returning users.
3. **Preventing Cumulative Layout Shift (CLS)**: Added explicit dimensions and lazy-loading tags on image avatars to avoid structural layouts reflowing during load.
4. **Optimized API Responses**: The GitHub backend proxy extracts only the needed keys (`name`, `description`, `html_url`, `stargazers_count`, `language`, `updated_at`) from the Github API payload before serving the client, saving up to 90% in payload bandwidth.

---

## Step-by-Step Production Deployment

Follow these instructions to deploy the application into a live environment.

### 1. Database: MongoDB Atlas
1. Sign in to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) and create a database cluster (the free Tier cluster is sufficient).
2. Navigate to **Database Access** and click **Add New Database User**. Define a username, secure password, and select **Read and write to any database**.
3. Navigate to **Network Access** and click **Add IP Address**. Choose **Allow Access From Anywhere** (`0.0.0.0/0`) or enter the dedicated IP addresses of your Render server.
4. Go to the Database Deployment screen, click **Connect**, select **Drivers**, copy the connection string, and replace YOUR_DATABASE_PASSWORD and YOUR_DATABASE_USERNAME with your database user credentials.

### 2. Backend: API on Render
You can deploy using Render's Blueprint config (`render.yaml`) or manually:

#### Option A: Using the Blueprint (Recommended)
1. Commit your repository to GitHub.
2. Log in to [Render](https://render.com/) and go to the **Blueprints** tab.
3. Click **New Blueprint Instance**, link your GitHub repo, and approve the plan.
4. Set the required environment variables when prompted. Render will configure the Web Service automatically using `render.yaml`.

#### Option B: Manual Web Service Setup
1. On the Render Dashboard, click **New +** and select **Web Service**.
2. Link your GitHub repository.
3. Configure the following parameters:
   - **Name**: `devpulse-api`
   - **Environment/Runtime**: `Node`
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
4. Navigate to **Environment** and add the following variables:
   - `NODE_ENV`: `production`
   - `PORT`: `10000`
   - `MONGO_URI`: `your_atlas_connection_string`
   - `JWT_SECRET`: `your_secure_production_jwt_secret`
   - `JWT_EXPIRES_IN`: `7d`
   - `CLIENT_ORIGIN`: `your_vercel_frontend_url` (e.g. `https://devpulse.vercel.app`)
   - `GITHUB_TOKEN`: `your_personal_github_token` (optional, to bypass GitHub rate limiting)

### 3. Frontend: On Vercel
1. Log in to [Vercel](https://vercel.com/) and click **Add New...** -> **Project**.
2. Import your GitHub repository.
3. In the project configure screen:
   - **Framework Preset**: Choose **Vite** (Vercel should automatically detect this).
   - **Root Directory**: Set to `frontend`.
4. Expand **Environment Variables** and add the following:
   - `VITE_API_URL`: `your_render_backend_url/api` (e.g. `https://devpulse-api.onrender.com/api`)
5. Click **Deploy**. Vercel will build the frontend and serve it globally. The rewrite rules in `frontend/vercel.json` will ensure React Router handles paths on refresh.

---

## Git Workflow

This codebase was structured iteratively using standard Git flows:
- `main` branch serves as the production-ready code.
- Features were developed in isolation:
  - `feature/auth`: Auth framework, passwords, JWT, route protections.
  - `feature/frontend-ui`: Component design, styling, and grid/flexbox layouts.
  - `feature/api-integration`: CORS integration, environments config, GitHub route proxy.
  - `feature/optimization`: Bundle optimizations, image performance, payload compression.
