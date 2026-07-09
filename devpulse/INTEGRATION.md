# Frontend ↔ Backend Integration Notes

## The bridge
- Frontend calls the backend exclusively through `frontend/src/api/client.ts`,
  which reads the base URL from `VITE_API_URL` (set in `frontend/.env`).
- Backend allows cross-origin requests only from the origin(s) listed in
  `CLIENT_ORIGIN` (see `backend/src/server.js`), configured via `.env`.
- In local dev: frontend on `http://localhost:5173`, backend on
  `http://localhost:5000`. In production these become the deployed
  Vercel/Render URLs — update both `.env` files accordingly.

## Environment variables
| Variable         | Where          | Purpose                                   |
|-------------------|---------------|--------------------------------------------|
| `VITE_API_URL`    | frontend/.env | Base URL the SPA calls for the API         |
| `MONGO_URI`       | backend/.env  | MongoDB Atlas connection string            |
| `JWT_SECRET`      | backend/.env  | Signing key for auth tokens                |
| `CLIENT_ORIGIN`   | backend/.env  | Comma-separated list of allowed CORS origins |
| `GITHUB_TOKEN`    | backend/.env  | Optional, raises GitHub API rate limit     |

Never commit real `.env` files — only `.env.example` is tracked in git.

## GitHub API integration
- `backend/src/routes/github.js` proxies `GET /api/github/:username/repos`
  to the public GitHub REST API, using `async/await` and returning the
  3 most recently updated repositories.
- Proxying (instead of calling GitHub directly from the browser) keeps the
  optional `GITHUB_TOKEN` secret and centralizes rate-limit/error handling.
- The frontend calls this through `api.getGitHubRepos()` inside the
  lazy-loaded `GitHubFeed` component.
