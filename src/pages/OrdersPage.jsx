import React from 'react';
import { useSearchParams } from 'react-router-dom';
import AdminLayout from '@/components/AdminLayout';
import OrdersListTab from '@/components/OrdersListTab';
import OrderGroupsListTab from '@/components/OrderGroupsListTab';
import { getCookie, setCookie } from '@/utils/cookies';

const TABS = [
  { key: 'single', label: 'Single' },
  { key: 'group', label: 'Group' },
];

const TAB_COOKIE = 'orders_active_tab';

// Orders page with two tabs:
//   single — the flat orders list (default)
//   group  — the order-groups (tabs) list
// Active tab resolves as: explicit URL ?tab= (back-links) > last-used cookie >
// default 'single'. Selecting a tab updates both the URL and the cookie so the
// page reopens on the same tab next visit.
export default function OrdersPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlTab = searchParams.get('tab');
  const activeTab =
    urlTab === 'group' || urlTab === 'single'
      ? urlTab
      : getCookie(TAB_COOKIE) === 'group'
        ? 'group'
        : 'single';

  const selectTab = (key) => {
    setCookie(TAB_COOKIE, key);
    setSearchParams(key === 'single' ? {} : { tab: key });
  };

  return (
    <AdminLayout>
      <div className="page-header d-print-none mb-3">
        <div className="row align-items-center">
          <div className="col">
            <h2 className="page-title">Orders</h2>
          </div>
        </div>
      </div>

      <ul className="nav nav-tabs mb-3">
        {TABS.map((tab) => (
          <li key={tab.key} className="nav-item">
            <button
              type="button"
              className={`nav-link ${activeTab === tab.key ? 'active' : ''}`}
              onClick={() => selectTab(tab.key)}
            >
              {tab.label}
            </button>
          </li>
        ))}
      </ul>

      {activeTab === 'group' ? <OrderGroupsListTab /> : <OrdersListTab />}
    </AdminLayout>
  );
}
