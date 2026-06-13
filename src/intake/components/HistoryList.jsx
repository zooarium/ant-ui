import React from 'react';
import { Card, CardBody, Spinner, Alert, Button, IconAlertTriangle } from '@aviary-ui/ui';
import { useHistory } from '../hooks/useHistory';
import { money } from '../lib/format';
import { formatDateTime } from '@/utils/datetime';
import StatusBadge from './StatusBadge';

// "Your past visits" — tabs this device participated in, newest first.
export default function HistoryList({ onOpenTab }) {
  const { tabs, isLoading, error } = useHistory();

  if (isLoading) return <Spinner centered />;
  if (error) return <Alert type="error" icon={IconAlertTriangle}>{error}</Alert>;
  if (!tabs.length) return <p className="text-secondary text-center py-4">No past visits yet.</p>;

  return (
    <div className="d-flex flex-column gap-2">
      {tabs.map((tab) => (
        <Card key={tab.id} role="button" onClick={() => onOpenTab(tab.token)}>
          <CardBody className="d-flex justify-content-between align-items-center">
            <div>
              <div className="fw-bold">{tab.label || `Tab #${tab.id}`}</div>
              <div className="text-secondary small">
                {tab.orders_count} order{tab.orders_count === 1 ? '' : 's'}
                {tab.created_at && <> · {formatDateTime(tab.created_at)}</>}
              </div>
            </div>
            <div className="d-flex align-items-center gap-2">
              <StatusBadge status={tab.status} kind="tab" />
              <span className="fw-bold">{money(tab.total)}</span>
            </div>
          </CardBody>
        </Card>
      ))}
    </div>
  );
}
