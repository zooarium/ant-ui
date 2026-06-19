import React, { useEffect, useState } from 'react';
import { Spinner, Alert, Button, IconAlertTriangle } from '@aviary-ui/ui';
import { getSiteKey, TenantNotFound } from '../lib/siteKey';
import TenantNotFoundPage from '../pages/TenantNotFoundPage';

// Resolves the tenant site key before rendering a guest surface. Distinguishes
// "no such store" (404 → soft TenantNotFoundPage) from transient failures
// (429/5xx/network → retry). Renders children only once a site key is in hand;
// the actual token exchange still happens lazily on the first intake API call.
export default function TenantGate({ children }) {
  const [state, setState] = useState({ status: 'loading' });

  useEffect(() => {
    let alive = true;
    getSiteKey()
      .then(() => alive && setState({ status: 'ok' }))
      .catch((err) => {
        if (!alive) return;
        if (err instanceof TenantNotFound) setState({ status: 'notfound' });
        else setState({ status: 'error', message: err.message });
      });
    return () => {
      alive = false;
    };
  }, []);

  if (state.status === 'loading') {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <Spinner />
      </div>
    );
  }

  if (state.status === 'notfound') return <TenantNotFoundPage />;

  if (state.status === 'error') {
    return (
      <div className="page">
        <div className="container py-5">
          <div className="row justify-content-center">
            <div className="col-md-6 text-center">
              <Alert type="error" icon={IconAlertTriangle} className="mb-3">
                {state.message || 'Could not reach the store. Please try again.'}
              </Alert>
              <Button onClick={() => window.location.reload()}>Try again</Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return children;
}
