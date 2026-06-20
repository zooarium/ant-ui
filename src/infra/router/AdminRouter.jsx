import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { PrivateRoute, PublicRoute, RootRedirect, ImpersonationExchange } from '@aviary-ui/ui';
import { ADMIN_PATHS } from '@/config/nav';
import PageLoader from '@/infra/router/PageLoader';

const LoginPage = lazy(() => import('@/pages/LoginPage'));
const DashboardPage = lazy(() => import('@/pages/DashboardPage'));
const AttributesPage = lazy(() => import('@/pages/AttributesPage'));
const AttributeDetailPage = lazy(() => import('@/pages/AttributeDetailPage'));
const CategoriesPage = lazy(() => import('@/pages/CategoriesPage'));
const CategoryDetailPage = lazy(() => import('@/pages/CategoryDetailPage'));
const ProductsPage = lazy(() => import('@/pages/ProductsPage'));
const ProductDetailPage = lazy(() => import('@/pages/ProductDetailPage'));
const OrdersPage = lazy(() => import('@/pages/OrdersPage'));
const OrderDetailPage = lazy(() => import('@/pages/OrderDetailPage'));
const OrderGroupDetailPage = lazy(() => import('@/pages/OrderGroupDetailPage'));

// Wrap a page in PrivateRoute with the admin login path.
function Private({ children }) {
  return <PrivateRoute loginPath={ADMIN_PATHS.login}>{children}</PrivateRoute>;
}

// Admin app — served on its own domain (e.g. admin.shop.com). Tenant is
// recognized from the login JWT (app_id/division_id claims), so there is no
// site-key lookup or URL tenant resolution here. basename stays "/".
export default function AdminRouter() {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Root → dashboard if authed, else login */}
          <Route
            path="/"
            element={<RootRedirect homePath={ADMIN_PATHS.dashboard} loginPath={ADMIN_PATHS.login} />}
          />
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
          {/* Impersonation handoff landing: a sysadmin "logging in as a user"
              from keeper-ui lands here with a one-time code in the URL fragment. */}
          <Route
            path={ADMIN_PATHS.impersonateExchange}
            element={<ImpersonationExchange redirectTo={ADMIN_PATHS.dashboard} loginPath={ADMIN_PATHS.login} />}
          />
          <Route path={ADMIN_PATHS.dashboard} element={<Private><DashboardPage /></Private>} />
          <Route path={ADMIN_PATHS.attributes} element={<Private><AttributesPage /></Private>} />
          <Route path={`${ADMIN_PATHS.attributes}/:id`} element={<Private><AttributeDetailPage /></Private>} />
          <Route path={ADMIN_PATHS.categories} element={<Private><CategoriesPage /></Private>} />
          <Route path={`${ADMIN_PATHS.categories}/:id`} element={<Private><CategoryDetailPage /></Private>} />
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
