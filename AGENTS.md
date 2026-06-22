# NumCrunch

NumCrunch is a fully client-side Vite + React 19 + TypeScript SPA (an Apple Calculator–inspired calculator with Basic, Scientific, and Programmer modes). There is no backend, database, or external API; all computation runs in the browser.

## Cursor Cloud specific instructions

- Single service: the Vite dev server. Start it with `npm run dev` (serves on `http://localhost:5173`). The update script already runs `npm install`, so dependencies are present on startup.
- Standard commands live in `package.json`: `npm run dev` (dev server), `npm run build` (`tsc -b && vite build`, type-checks then builds to `dist/`), `npm run preview` (serve the production build).
- There is no test runner and no lint config in this repo. Type-checking via `tsc -b` (run through `npm run build`) is the closest verification step; do not assume `npm test`/`npm run lint` exist.
- No environment variables or `.env` files are needed.
