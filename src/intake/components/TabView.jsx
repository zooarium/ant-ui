import React from 'react';
import { Card, CardHeader, CardTitle, CardBody, Spinner, Alert, IconAlertTriangle } from '@aviary-ui/ui';
import { useTab } from '../hooks/useTab';
import { money } from '../lib/format';
import StatusBadge from './StatusBadge';

// Shared-tab view by token — everyone's orders + combined total. Polls so new
// orders and reception status changes appear without a manual refresh.
export default function TabView({ token }) {
  const { tab, isLoading, error } = useTab(token);

  if (isLoading) return <Spinner centered />;
  if (error) return <Alert type="error" icon={IconAlertTriangle}>{error}</Alert>;
  if (!tab) return <Alert type="warning">Tab not found.</Alert>;

  return (
    <Card>
      <CardHeader className="d-flex justify-content-between align-items-center">
        <CardTitle>{tab.label || 'Tab'}</CardTitle>
        <StatusBadge status={tab.status} kind="tab" />
      </CardHeader>
      <CardBody>
        {!tab.orders?.length ? (
          <p className="text-secondary mb-0">No orders on this tab yet.</p>
        ) : (
          tab.orders.map((o) => (
            <div key={o.id} className="d-flex justify-content-between align-items-center mb-2">
              <div>
                <span className="fw-bold me-2">{o.customer_name}</span>
                <StatusBadge status={o.status} />
              </div>
              <span className="fw-bold">{money(o.total)}</span>
            </div>
          ))
        )}
        <hr />
        <div className="d-flex justify-content-between fw-bold fs-3">
          <span>Combined total</span>
          <span>{money(tab.total)}</span>
        </div>
      </CardBody>
    </Card>
  );
}
