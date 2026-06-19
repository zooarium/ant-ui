import '@tabler/core/dist/css/tabler.min.css';
import './index.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import PublicRouter from './infra/router/PublicRouter.jsx';

// Public, tenant-facing entry (index.html). No @aviary-ui/core configure() —
// that HTTP client is admin-only and lives in admin-main.jsx. The intake flow
// uses its own guest-token client (src/intake/lib/http.js).
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App>
      <PublicRouter />
    </App>
  </StrictMode>
);
