import React from 'react';
import { Spinner } from '@aviary-ui/ui';

// Suspense fallback shared by PublicRouter and AdminRouter.
export default function PageLoader() {
  return (
    <div className="d-flex justify-content-center align-items-center vh-100">
      <Spinner />
    </div>
  );
}
