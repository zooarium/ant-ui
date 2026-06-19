import React from 'react';
import { Alert, IconAlertTriangle } from '@aviary-ui/ui';

// Soft "store not found" — rendered (HTTP 200) when keeper has no active key for
// this URL, instead of a hard browser 404. Shown for unknown subdomains and
// unknown /s/<slug> stores.
export default function TenantNotFoundPage() {
  return (
    <div className="page">
      <div className="container py-5">
        <div className="row justify-content-center">
          <div className="col-md-6 text-center">
            <Alert type="error" icon={IconAlertTriangle}>
              <h1 className="h3 mb-2">Store not found</h1>
              <p className="mb-0">
                We couldn&apos;t find a store at this address. Check the link, or
                contact the business you were trying to reach.
              </p>
            </Alert>
          </div>
        </div>
      </div>
    </div>
  );
}
