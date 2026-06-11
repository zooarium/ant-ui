import { IconLayoutDashboard, IconTag, IconPackage, IconShoppingCart } from '@aviary-ui/ui';

// All admin routes live under /admin — root "/" is reserved for the public site.
export const ADMIN_PATHS = {
  login: '/admin/login',
  dashboard: '/admin/dashboard',
  attributes: '/admin/attributes',
  products: '/admin/products',
  orders: '/admin/orders',
};

// Navigation items passed to AppLayout.
// Add/remove entries here; sidebar updates everywhere automatically.
export const NAV_ITEMS = [
  { path: ADMIN_PATHS.dashboard, label: 'Dashboard', Icon: IconLayoutDashboard },
  { path: ADMIN_PATHS.attributes, label: 'Attributes', Icon: IconTag },
  { path: ADMIN_PATHS.products, label: 'Products', Icon: IconPackage },
  { path: ADMIN_PATHS.orders, label: 'Orders', Icon: IconShoppingCart },
];
