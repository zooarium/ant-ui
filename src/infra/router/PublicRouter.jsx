import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { resolveTenant } from '@/infra/tenant';
import PageLoader from '@/infra/router/PageLoader';
import TenantGate from '@/intake/components/TenantGate';
import TenantNotFoundPage from '@/intake/pages/TenantNotFoundPage';

// Tenant-branded landing ("digital presence"). Fed live by keeper /apps/lookup
// + ant /public/storefront (see usePublicStorefront).
const TenantHomePage = lazy(() => import('@/public/storefront/TenantHomePage'));
// Public order-intake flow (guest token). Self-contained — no admin auth guards.
const IntakePage = lazy(() => import('@/intake/pages/IntakePage'));

// Public, tenant-facing app. The tenant is resolved from the URL (own domain /
// subdomain / shop.com/s/<slug>); for slug tenants the basename strips the
// "/s/<slug>" prefix so in-app routes (/, /intake) stay stable. Admin lives on
// its own domain (AdminRouter), so no /admin routes here.
export default function PublicRouter() {
  const { basename } = resolveTenant();

  return (
    <BrowserRouter basename={basename}>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Tenant resolved before any guest surface renders — invalid tenant
              (bad slug/domain) → TenantNotFoundPage, never the dummy storefront. */}
          <Route
            path="/"
            element={
              <TenantGate>
                <TenantHomePage />
              </TenantGate>
            }
          />
          <Route
            path="/intake"
            element={
              <TenantGate>
                <IntakePage />
              </TenantGate>
            }
          />
          <Route path="*" element={<TenantNotFoundPage />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
