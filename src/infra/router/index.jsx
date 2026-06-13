import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { PrivateRoute, PublicRoute, RootRedirect, Spinner } from '@aviary-ui/ui';
import { ADMIN_PATHS } from '@/config/nav';

const WelcomePage = lazy(() => import('../../pages/WelcomePage'));
const LoginPage = lazy(() => import('../../pages/LoginPage'));
const DashboardPage = lazy(() => import('../../pages/DashboardPage'));
const AttributesPage = lazy(() => import('../../pages/AttributesPage'));
const AttributeDetailPage = lazy(() => import('../../pages/AttributeDetailPage'));
const ProductsPage = lazy(() => import('../../pages/ProductsPage'));
const ProductDetailPage = lazy(() => import('../../pages/ProductDetailPage'));
const OrdersPage = lazy(() => import('../../pages/OrdersPage'));
const OrderDetailPage = lazy(() => import('../../pages/OrderDetailPage'));
const OrderGroupDetailPage = lazy(() => import('../../pages/OrderGroupDetailPage'));

function PageLoader() {
  return (
    <div className="d-flex justify-content-center align-items-center vh-100">
      <Spinner />
    </div>
  );
}

// Wrap a page in PrivateRoute with the admin login path.
function Private({ children }) {
  return <PrivateRoute loginPath={ADMIN_PATHS.login}>{children}</PrivateRoute>;
}

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Public site (root domain) — customer-facing pages live here */}
          <Route path="/" element={<WelcomePage />} />

          {/* Admin app — everything (incl. login) under /admin */}
          <Route
            path="/admin"
            element={<RootRedirect homePath={ADMIN_PATHS.dashboard} loginPath={ADMIN_PATHS.login} />}
          />
          <Route
            path={ADMIN_PATHS.login}
            element={
              <PublicRoute homePath={ADMIN_PATHS.dashboard}>
                <LoginPage />
              </PublicRoute>
            }
          />
          <Route path={ADMIN_PATHS.dashboard} element={<Private><DashboardPage /></Private>} />
          <Route path={ADMIN_PATHS.attributes} element={<Private><AttributesPage /></Private>} />
          <Route path={`${ADMIN_PATHS.attributes}/:id`} element={<Private><AttributeDetailPage /></Private>} />
          <Route path={ADMIN_PATHS.products} element={<Private><ProductsPage /></Private>} />
          <Route path={`${ADMIN_PATHS.products}/:id`} element={<Private><ProductDetailPage /></Private>} />
          <Route path={ADMIN_PATHS.orders} element={<Private><OrdersPage /></Private>} />
          <Route path={`${ADMIN_PATHS.orders}/:id`} element={<Private><OrderDetailPage /></Private>} />
          <Route path={`${ADMIN_PATHS.orderGroups}/:id`} element={<Private><OrderGroupDetailPage /></Private>} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
