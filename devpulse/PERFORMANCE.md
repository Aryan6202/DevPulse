# Performance Optimizations

1. **Lazy loading** — `GitHubFeed` is loaded via `React.lazy()` + `Suspense`
   in `frontend/src/App.tsx`, splitting it into its own JS chunk
   (confirmed in build output: `GitHubFeed-*.js` ships separately from
   `index-*.js`). It only loads once a profile with a GitHub username
   is available.
2. **Vendor chunk splitting** — `vite.config.ts` manually splits
   `react`/`react-dom`/`react-router-dom` into a `vendor` chunk so it can
   be cached independently of app code that changes more often.
3. **Image optimization** — `ProfileHeader` avatar images use native
   `loading="lazy"` and explicit `width`/`height` attributes to reserve
   layout space and avoid Cumulative Layout Shift (CLS).
4. **Payload limits** — Express body parser is capped at `10kb`
   (`server.js`) to avoid oversized requests impacting response time.
5. **Rate limiting** — `express-rate-limit` on `/api/auth` protects
   response times under abusive load and reduces brute-force risk.
6. **Minimal API payloads** — the GitHub proxy route strips the raw
   GitHub API response down to only the fields the UI needs
   (`name`, `description`, `url`, `stars`, `language`, `updatedAt`),
   cutting payload size significantly versus the full repo object.

## Suggested next steps for production
- Add a CDN in front of the Vercel deployment (Vercel does this by default).
- Add HTTP caching headers on `/api/github/:username/repos` (e.g. 5 min)
  since GitHub data doesn't need to be real-time to the second.
- Run `npm run build -- --report` / Lighthouse CI in the deploy pipeline
  to track Core Web Vitals over time.
