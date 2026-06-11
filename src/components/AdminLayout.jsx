import React from 'react';
import { AppLayout } from '@aviary-ui/ui';
import { NAV_ITEMS, ADMIN_PATHS } from '@/config/nav';
import { config } from '@/infra/config';

// AppLayout pre-wired for the /admin area — use this on every admin page.
export default function AdminLayout({ children }) {
  return (
    <AppLayout
      navItems={NAV_ITEMS}
      appName={config.appName}
      loginPath={ADMIN_PATHS.login}
      homePath={ADMIN_PATHS.dashboard}
    >
      {children}
    </AppLayout>
  );
}
