# beaver-ui

Project scaffold for apps that consume `@aviary-ui/core` and `@aviary-ui/ui`.

Clone this repo, rename it, and build your app without touching the shared library.

---

## Prerequisites

- Node 22 (managed via `.nvmrc` + nvm)
- `aviary-ui` cloned at `../aviary-ui` and built (`make build` inside `aviary-ui/`)

---

## Setup

```bash
# 1. Clone
git clone <this-repo> my-app
cd my-app

# 2. Build aviary-ui packages first (one-time)
cd ../aviary-ui && make build && cd ../my-app

# 3. Install
make install

# 4. Configure env
cp .env.example .env.development
# Edit .env.development with your API URLs

# 5. Start dev server
make dev
```

---

## Available commands

| Command | Description |
|---------|-------------|
| `make install` | Install dependencies |
| `make update` | Update all npm packages |
| `make dev` | Start Vite dev server |
| `make build` | Build for production |
| `make analyze` | Build + open bundle treemap (`stats.html`) |
| `make lint` | Run ESLint |
| `make lint-fix` | Run ESLint with auto-fix |
| `make format` | Format with Prettier |
| `make test` | Run tests once |
| `make test-watch` | Run tests in watch mode |
| `make clean` | Remove `dist/` and `node_modules/` |

---

## Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_APP_NAME` | No | App display name (default: `App`) |
| `VITE_API_URL` | Yes | Auth service base URL |
| `VITE_API_BE_URL` | Yes | Main API base URL |
| `VITE_REFRESH_PATH` | No | Token refresh path (default: `/users/refresh`) |
| `VITE_MOCK_API` | No | Set `true` to use MSW mock API in dev |

---

## Project structure

```
src/
  api/           HTTP API modules (one file per resource)
  config/        nav.jsx — navigation items for AppLayout
  hooks/         TanStack Query hooks (one file per resource)
  infra/
    config.js    App-specific env vars
    router/      React Router setup
  mocks/         MSW handlers, browser worker, Node server
  pages/         Route-level components
  test/          Vitest setup and test files
  index.css      Minimal Tabler overrides
  App.jsx        Provider stack
  main.jsx       Entry point — configure() + app mount
```

---

## How to add a new resource

### 1. API module

Copy `src/api/thing.js` → `src/api/foo.js`, replace `thing`/`Thing`/`things` with your resource name.

### 2. Query hook

Copy `src/hooks/useThing.js` → `src/hooks/useFoo.js`, update imports and resource names.

### 3. Mock handlers

Add GET/POST/PUT/DELETE handlers to `src/mocks/handlers.js`.

### 4. Page

Create `src/pages/FooPage.jsx`, wrap with `<AppLayout navItems={NAV_ITEMS} appName={config.appName}>`.

### 5. Route

In `src/infra/router/index.jsx`:
- Lazy-import the page
- Add a `<Route>` inside `<PrivateRoute>` (or bare, for public pages)

### 6. Navigation

Add an entry to `src/config/nav.jsx` — the sidebar updates automatically.

---

## Mock API (dev mode)

Set `VITE_MOCK_API=true` in `.env.development`. MSW intercepts all requests in the browser — no backend needed.

Tests always use MSW via `src/mocks/server.js` regardless of this flag.

---

## Auth guards

```jsx
import { PrivateRoute, RequireRole, RequirePermission } from '@aviary-ui/ui';

// Route-level
<PrivateRoute><ProtectedPage /></PrivateRoute>

// Component-level
<RequireRole role="admin"><AdminPanel /></RequireRole>
<RequirePermission permission="reports:export"><ExportButton /></RequirePermission>
```

`user.role` and `user.permissions[]` come from `storage.getUser()` (set on login).

---

## vite.config.js — required sections

These are already in place. Do not remove them when customising:

```js
resolve: {
  dedupe: ['react', 'react-dom'],  // prevents dual-React crash from file: symlinks
},
server: {
  watch: {
    ignored: (path) => path.includes('node_modules') && !path.includes('@aviary-ui'),
  },
},
optimizeDeps: {
  exclude: ['@aviary-ui/core', '@aviary-ui/ui'],
},
```

---

## Storefront `about.body` HTML

The public storefront's About section renders `about.body` (from keeper
`GET /apps/lookup`) as sanitized HTML (DOMPurify). It may contain block markup,
so highlight chips are authored directly in the body rather than a separate
field. Use the existing storefront classes to reproduce the chip row:

```html
<p>For over two decades, Saffron &amp; Sage has served slow-cooked curries,
tandoor-charred breads, and seasonal plates built from produce sourced each
morning.</p>

<div class="row g-3 mt-2">
  <div class="col-6 col-lg-3">
    <div class="sf-highlight">
      <div class="sf-highlight__label">Est. 2003</div>
      <div class="sf-highlight__detail">20+ years serving the neighbourhood</div>
    </div>
  </div>
  <div class="col-6 col-lg-3">
    <div class="sf-highlight">
      <div class="sf-highlight__label">Farm to table</div>
      <div class="sf-highlight__detail">Produce sourced fresh daily</div>
    </div>
  </div>
  <!-- repeat .col blocks per highlight -->
</div>
```

Sanitizer-permitted classes: `row`, `g-3`, `mt-2`, `col-6`, `col-lg-3`,
`sf-highlight`, `sf-highlight__label`, `sf-highlight__detail`. Standard tags
(`p`, `div`, `strong`, `em`, `ul`, `li`, `a`, `br`, `h3`, `h4`) are allowed by
DOMPurify's default config — no custom allow-list needed unless tightened.

---

## Renaming this scaffold

1. Update `package.json` → `name`
2. Update `VITE_APP_NAME` in `.env.development`
3. Update `src/config/nav.jsx` with your routes
4. Delete `src/api/thing.js` and `src/hooks/useThing.js` when no longer needed as reference
