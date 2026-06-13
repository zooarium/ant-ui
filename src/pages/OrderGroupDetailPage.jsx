import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Button,
  Card,
  CardBody,
  Spinner,
  ConfirmDialog,
  IconEdit,
  IconTrash,
  IconArrowLeft,
  IconPlus,
  useNotification,
} from '@aviary-ui/ui';
import AdminLayout from '@/components/AdminLayout';
import OrderGroupFormModal from '@/components/OrderGroupFormModal';
import OrderFormModal from '@/components/OrderFormModal';
import OrderStatusSelect from '@/components/OrderStatusSelect';
import MoveOrderModal from '@/components/MoveOrderModal';
import AutoRefreshSelect from '@/components/AutoRefreshSelect';
import { useOrderGroup } from '@/hooks/useOrderGroups';
import { useOrders, useOrder } from '@/hooks/useOrders';
import { ADMIN_PATHS } from '@/config/nav';
import { formatDateTime } from '@/utils/datetime';

export default function OrderGroupDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  const [isEditOpen, setEditOpen] = useState(false);
  const [isAddOpen, setAddOpen] = useState(false);
  const [isConfirmOpen, setConfirmOpen] = useState(false);
  const [moveOrder, setMoveOrder] = useState(null);
  const [editOrderId, setEditOrderId] = useState(null);
  const [deleteOrderId, setDeleteOrderId] = useState(null);
  const [refreshSeconds, setRefreshSeconds] = useState(0);

  const refetchInterval = refreshSeconds > 0 ? refreshSeconds * 1000 : false;
  const { group, isLoading, error, refetch, update, remove } = useOrderGroup(id, {
    refetchInterval,
  });
  // Per-order status changes + group moves on member rows; create/update/delete
  // for managing orders here.
  const {
    setStatus: setOrderStatus,
    setGroup,
    create: createOrder,
    update: updateOrder,
    remove: removeOrder,
  } = useOrders();
  // Member rows are summaries (no items); fetch the full order for editing.
  const { order: editOrder } = useOrder(editOrderId);

  const orders = group?.orders ?? [];

  const handleDeleteOrder = async () => {
    // Deleting the last order auto-deletes the group server-side — leave for the
    // group list instead of landing on a 404 detail page.
    const wasLast = orders.length <= 1;
    try {
      await removeOrder(deleteOrderId);
      if (wasLast) {
        navigate(`${ADMIN_PATHS.orders}?tab=group`);
      } else {
        refetch();
      }
    } catch (err) {
      showNotification(err.message, 'error');
    } finally {
      setDeleteOrderId(null);
    }
  };

  const handleDelete = async () => {
    try {
      await remove();
      navigate(`${ADMIN_PATHS.orders}?tab=group`);
    } catch (err) {
      // 409 when the group still has orders.
      showNotification(err.message, 'error');
    } finally {
      setConfirmOpen(false);
    }
  };

  return (
    <AdminLayout>
      <div className="page-header d-print-none mb-3">
        <div className="row align-items-center">
          <div className="col">
            <Link
              to={`${ADMIN_PATHS.orders}?tab=group`}
              className="text-secondary d-inline-flex align-items-center gap-1 mb-1"
            >
              <IconArrowLeft size={16} />
              Groups
            </Link>
            <h2 className="page-title">Group #{id}</h2>
          </div>
          {group && (
            <div className="col-auto ms-auto d-flex gap-2 align-items-center">
              <div style={{ width: '10rem' }}>
                <AutoRefreshSelect value={refreshSeconds} onChange={setRefreshSeconds} />
              </div>
              <Button
                variant="outline-secondary"
                onClick={() => setEditOpen(true)}
                className="d-flex align-items-center gap-2"
              >
                <IconEdit size={16} />
                Rename
              </Button>
              <Button
                variant="danger"
                onClick={() => setConfirmOpen(true)}
                disabled={(group.orders_count ?? orders.length) > 0}
                title={
                  (group.orders_count ?? orders.length) > 0
                    ? 'Move out all orders before deleting'
                    : 'Delete group'
                }
                className="d-flex align-items-center gap-2"
              >
                <IconTrash size={16} />
                Delete
              </Button>
            </div>
          )}
        </div>
      </div>

      {isLoading ? (
        <Spinner centered />
      ) : error ? (
        <Card>
          <CardBody>
            <p className="text-danger mb-3">{error}</p>
            <Button variant="outline-danger" onClick={refetch}>
              Retry
            </Button>
          </CardBody>
        </Card>
      ) : !group ? (
        <Card>
          <CardBody>
            <p className="text-secondary mb-0">Tab not found.</p>
          </CardBody>
        </Card>
      ) : (
        <>
          <Card className="mb-3">
            <CardBody>
              <div className="datagrid">
                <div className="datagrid-item">
                  <div className="datagrid-title">Label</div>
                  <div className="datagrid-content">{group.label || '—'}</div>
                </div>
                <div className="datagrid-item">
                  <div className="datagrid-title">Token</div>
                  <div className="datagrid-content"><code>{group.token}</code></div>
                </div>
                <div className="datagrid-item">
                  <div className="datagrid-title">Combined total</div>
                  <div className="datagrid-content fw-bold">
                    {Number(group.total ?? 0).toFixed(2)}
                  </div>
                </div>
                <div className="datagrid-item">
                  <div className="datagrid-title">Created</div>
                  <div className="datagrid-content">{formatDateTime(group.created_at)}</div>
                </div>
                <div className="datagrid-item">
                  <div className="datagrid-title">Updated</div>
                  <div className="datagrid-content">{formatDateTime(group.updated_at)}</div>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody noPadding>
              <div className="card-header d-flex align-items-center justify-content-between">
                <h3 className="card-title mb-0">Orders ({orders.length})</h3>
                <Button size="sm" onClick={() => setAddOpen(true)} className="d-flex align-items-center gap-2">
                  <IconPlus size={16} />
                  New Order
                </Button>
              </div>
              {orders.length === 0 ? (
                <p className="text-secondary p-3 mb-0">No orders in this tab.</p>
              ) : (
                <table className="table table-vcenter table-hover card-table">
                  <thead>
                    <tr>
                      <th className="w-1">ID</th>
                      <th>Customer</th>
                      <th>Ordered at</th>
                      <th className="text-end">Total</th>
                      <th style={{ width: '11rem' }}>Status</th>
                      <th className="w-1"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order) => (
                      <tr
                        key={order.id}
                        role="button"
                        style={{ cursor: 'pointer' }}
                        onClick={() => navigate(`${ADMIN_PATHS.orders}/${order.id}`)}
                      >
                        <td className="text-secondary">{order.id}</td>
                        <td className="fw-medium">{order.customer_name}</td>
                        <td className="text-secondary">
                          {order.ordered_at ? formatDateTime(order.ordered_at) : '—'}
                        </td>
                        <td className="text-end">{Number(order.total ?? 0).toFixed(2)}</td>
                        <td>
                          <OrderStatusSelect order={order} setStatus={setOrderStatus} />
                        </td>
                        <td onClick={(e) => e.stopPropagation()}>
                          <div className="d-flex gap-1">
                            <Button
                              variant="outline-secondary"
                              size="sm"
                              onClick={() => setMoveOrder(order)}
                              title="Move to another group"
                            >
                              Move
                            </Button>
                            <Button
                              variant="outline-secondary"
                              size="sm"
                              icon
                              onClick={() => setEditOrderId(order.id)}
                              title="Edit order"
                            >
                              <IconEdit size={16} />
                            </Button>
                            <Button
                              variant="ghost-danger"
                              size="sm"
                              icon
                              onClick={() => setDeleteOrderId(order.id)}
                              title="Delete order"
                            >
                              <IconTrash size={16} />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan={3} className="text-end fw-bold">
                        Combined total
                      </td>
                      <td className="text-end fw-bold">{Number(group.total ?? 0).toFixed(2)}</td>
                      <td colSpan={2}></td>
                    </tr>
                  </tfoot>
                </table>
              )}
            </CardBody>
          </Card>
        </>
      )}

      <OrderFormModal
        isOpen={isAddOpen}
        onClose={() => setAddOpen(false)}
        order={null}
        lockGroupId={group?.id}
        onSubmit={createOrder}
      />

      <OrderFormModal
        isOpen={!!editOrder}
        onClose={() => setEditOrderId(null)}
        order={editOrder}
        onSubmit={(payload) => updateOrder(editOrderId, payload)}
      />

      <OrderGroupFormModal
        isOpen={isEditOpen}
        onClose={() => setEditOpen(false)}
        group={group}
        onSubmit={update}
      />

      <MoveOrderModal
        isOpen={!!moveOrder}
        onClose={() => setMoveOrder(null)}
        orderId={moveOrder?.id}
        currentGroupId={group?.id}
        onSubmit={(targetId) => setGroup(moveOrder.id, targetId)}
      />

      <ConfirmDialog
        isOpen={isConfirmOpen}
        message={`Delete group #${id}? This is only allowed when the group has no orders.`}
        onConfirm={handleDelete}
        onCancel={() => setConfirmOpen(false)}
      />

      <ConfirmDialog
        isOpen={deleteOrderId != null}
        message={`Delete order #${deleteOrderId}? This removes the order and all its items.`}
        onConfirm={handleDeleteOrder}
        onCancel={() => setDeleteOrderId(null)}
      />
    </AdminLayout>
  );
}
