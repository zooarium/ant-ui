import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, CardBody, Spinner, IconPlus } from '@aviary-ui/ui';
import OrderGroupFormModal from '@/components/OrderGroupFormModal';
import ListPagination from '@/components/ListPagination';
import AutoRefreshSelect from '@/components/AutoRefreshSelect';
import { useOrderGroups } from '@/hooks/useOrderGroups';
import { ADMIN_PATHS } from '@/config/nav';
import { formatDateTime } from '@/utils/datetime';

const LIMIT = 50;

// "Group" tab — the order-groups (tabs) list with its own status + auto-refresh filters.
export default function OrderGroupsListTab() {
  const navigate = useNavigate();
  const [offset, setOffset] = useState(0);
  const [refreshSeconds, setRefreshSeconds] = useState(0);
  const [isAddOpen, setAddOpen] = useState(false);

  const refetchInterval = refreshSeconds > 0 ? refreshSeconds * 1000 : false;
  const { groups, isLoading, error, refetch, create } = useOrderGroups(
    { limit: LIMIT, offset },
    { refetchInterval }
  );

  return (
    <>
      <div className="d-flex justify-content-end mb-3">
        <Button onClick={() => setAddOpen(true)} className="d-flex align-items-center gap-2">
          <IconPlus size={16} />
          New Group
        </Button>
      </div>

      <Card className="mb-3">
        <CardBody>
          <div className="row g-2">
            <div className="col-md-3">
              <AutoRefreshSelect value={refreshSeconds} onChange={setRefreshSeconds} />
            </div>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardBody noPadding>
          {isLoading ? (
            <Spinner centered />
          ) : error ? (
            <div className="p-4 text-center">
              <p className="text-danger mb-3">{error}</p>
              <Button variant="outline-danger" onClick={refetch}>
                Retry
              </Button>
            </div>
          ) : groups.length === 0 ? (
            <div className="p-5 text-center text-secondary">
              <p className="mb-3">No groups found.</p>
              <Button onClick={() => setAddOpen(true)}>Open first group</Button>
            </div>
          ) : (
            <>
              <table className="table table-vcenter table-hover card-table">
                <thead>
                  <tr>
                    <th className="w-1">ID</th>
                    <th>Label</th>
                    <th>Token</th>
                    <th>Orders</th>
                    <th>Created</th>
                    <th>Updated</th>
                  </tr>
                </thead>
                <tbody>
                  {groups.map((group) => (
                    <tr
                      key={group.id}
                      role="button"
                      style={{ cursor: 'pointer' }}
                      onClick={() => navigate(`${ADMIN_PATHS.orderGroups}/${group.id}`)}
                    >
                      <td className="text-secondary">{group.id}</td>
                      <td className="fw-medium">{group.label || '—'}</td>
                      <td className="text-secondary"><code>{group.token}</code></td>
                      <td className="text-secondary">{group.orders_count ?? 0}</td>
                      <td className="text-secondary">{formatDateTime(group.created_at)}</td>
                      <td className="text-secondary">{formatDateTime(group.updated_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <ListPagination offset={offset} limit={LIMIT} count={groups.length} onChange={setOffset} />
            </>
          )}
        </CardBody>
      </Card>

      <OrderGroupFormModal
        isOpen={isAddOpen}
        onClose={() => setAddOpen(false)}
        group={null}
        onSubmit={create}
      />
    </>
  );
}
