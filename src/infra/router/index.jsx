import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { PrivateRoute, RootRedirect, Spinner } from '@aviary-ui/ui';

const LoginPage = lazy(() => import('../../pages/LoginPage'));
const DashboardPage = lazy(() => import('../../pages/DashboardPage'));

function PageLoader() {
  return (
    <div className="d-flex justify-content-center align-items-center vh-100">
      <Spinner />
    </div>
  );
}

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <DashboardPage />
              </PrivateRoute>
            }
          />
          {/* Add new private routes here */}
          <Route
            path="/"
            element={<RootRedirect />}
          />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
