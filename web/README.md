# MLVPYC Web App

React + TypeScript + Vite + Tailwind v4 frontend for the youth club ledger.

## Design

A passbook/ledger aesthetic — ruled "paper" background, a deep ledger green + rupee-gold
palette, Fraunpm run devnces for headings, IBM Plex Sans for body text, IBM Plex Mono for all rupee
amounts (right-aligned like a real passbook). Loan statuses are shown as rotated ink-stamp
badges (PENDING / APPROVED / REJECTED / REPAID) — the one signature visual element, used
consistently everywhere a loan appears.

## Setup

```bash
npm install
npm run dev       # starts on http://localhost:5173, proxies /api to http://localhost:8080
```

Make sure the backend (`mlvpyc-backend`) is running on port 8080 first — see its README.

## Notes / what's simplified for now

- **No real login yet.** There's a "Viewing as" switcher in the header that lets you pick
  which member you're acting as — this is a stand-in until the backend's JWT auth
  (see backend `SecurityConfig` notes) is wired up. Swap this for a real login screen once
  that's ready; the `SessionContext` is where that would plug in.
- Admin-only actions (approve/reject loans, add members) are hidden based on the selected
  member's `role`, but the backend doesn't yet enforce this server-side — do that before
  going live with real money data.
- To seed a first term, POST to `/api/terms` (see backend README for an example `curl`).

## Structure

```
src/
  api/client.ts        — typed fetch wrapper, maps backend fallback errors to ApiRequestError
  context/              — "current user" session state
  hooks/useActiveTerm   — fetches the open term
  components/           — StatusStamp, Rupee, FallbackNotice, Layout
  pages/                — Dashboard, ApplyLoan, Loans, Members, Contributions
```
