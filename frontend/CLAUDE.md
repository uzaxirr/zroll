# Zroll Frontend

Next.js 14 app with Clerk auth, Tailwind CSS, and a FastAPI backend.

## Structure

```
src/
  app/
    dashboard/        # Admin pages (contributors, history, payroll, settings)
    portal/           # Contributor portal (payments, portfolio, tax)
    sign-in/, sign-up/
  components/         # Shared UI: badge, data-table, form-input, modal, page-header, sidebar, stat-card
  lib/
    api.ts            # Type definitions and direct fetch helpers (used in SSR or one-off calls)
    use-api.ts        # React hooks for data fetching with Clerk auth
```

## API Hooks (`use-api.ts`)

| Hook | Method | Returns |
|------|--------|---------|
| `useApi<T>(path)` | GET | `{ data, loading, error, refetch }` |
| `useApiPost<TBody, TRes>()` | POST | `{ post(path, body), loading }` |
| `useApiPut<TBody, TRes>()` | PUT | `{ put(path, body), loading }` |
| `useAuthenticatedDownload()` | any | `{ download(path, filename, opts?) }` |

All hooks inject Clerk Bearer tokens automatically. `API_BASE` defaults to `http://localhost:8001`.

## Design Tokens (Tailwind)

Colors: `green` (primary action), `primary` (text), `secondary` (labels), `muted` (hints), `error`, `warning`.
Borders: `card-border`, `row-border`. Backgrounds: `table-header`.
Radii: `rounded-card`, `rounded-btn`, `rounded-badge`.
Spacing: `space-y-section-gap` for page sections.
Fonts: `font-headline` (headings), `font-tabular` (numbers).

## Conventions

- All pages are `"use client"` with hooks for data fetching.
- Buttons follow the pattern: green bg for primary actions, border-only for secondary.
- Tables use raw `<table>` with consistent th/td classes, or the `DataTable` component.
- Modals use the `Modal` component (portal overlay, backdrop close, X button).
- Form fields use the `FormInput` component (label, input/select, error state).
- Loading states: centered `<p>` with `text-secondary text-sm`.
