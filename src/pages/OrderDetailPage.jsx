import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Button,
  Card,
  CardBody,
  Badge,
  Spinner,
  ConfirmDialog,
  IconEdit,
  IconTrash,
  IconArrowLeft,
  IconChevronRight,
  useNotification,
} from '@aviary-ui/ui';
import AdminLayout from '@/components/AdminLayout';
import OrderFormModal from '@/components/OrderFormModal';
import OrderStatusSelect from '@/components/OrderStatusSelect';
import MoveOrderModal from '@/components/MoveOrderModal';
import { useOrder, useOrders } from '@/hooks/useOrders';
import { orderStatusMeta } from '@/api/orders';
import { ADMIN_PATHS } from '@/config/nav';
import { formatDateTime } from '@/utils/datetime';

// Line total for an item: prefer the API's snapshotted line_total, else
// (price + summed attribute deltas) * quantity.
const lineTotalOf = (item) =>
  item.line_total != null
    ? Number(item.line_total)
    : (Number(item.price ?? 0) +
        (item.attributes ?? []).reduce((s, a) => s + Number(a.price_delta ?? 0), 0)) *
      Number(item.quantity ?? 0);

export default function OrderDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  const [isEditOpen, setEditOpen] = useState(false);
  const [isConfirmOpen, setConfirmOpen] = useState(false);
  const [isMoveOpen, setMoveOpen] = useState(false);

  const { order, isLoading, error, refetch } = useOrder(id);
  const { update, remove, setStatus, setGroup } = useOrders();

  const items = order?.products ?? [];
  // API order.total is the pre-tax subtotal (sum of line totals). Prefer it;
  // fall back to a local sum. Tax is applied on top.
  const subtotal =
    order?.total != null ? Number(order.total) : items.reduce((sum, item) => sum + lineTotalOf(item), 0);
  const taxPercent = Number(order?.tax_percent ?? 0);
  const taxAmount = (subtotal * taxPercent) / 100;
  const grandTotal = subtotal + taxAmount;

  const handleDelete = async () => {
    try {
      await remove(id);
      navigate(ADMIN_PATHS.orders);
    } catch (err) {
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
              to={ADMIN_PATHS.orders}
              className="text-secondary d-inline-flex align-items-center gap-1 mb-1"
            >
              <IconArrowLeft size={16} />
              Orders
            </Link>
            <h2 className="page-title">Order #{id}</h2>
          </div>
          {order && (
            <div className="col-auto ms-auto d-flex gap-2 align-items-center">
              <div style={{ width: '11rem' }}>
                <OrderStatusSelect order={order} setStatus={setStatus} />
              </div>
              <Button
                variant="outline-secondary"
                onClick={() => setEditOpen(true)}
                className="d-flex align-items-center gap-2"
              >
                <IconEdit size={16} />
                Edit
              </Button>
              <Button
                variant="danger"
                onClick={() => setConfirmOpen(true)}
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
      ) : !order ? (
        <Card>
          <CardBody>
            <p className="text-secondary mb-0">Order not found.</p>
          </CardBody>
        </Card>
      ) : (
        <>
          <Card className="mb-3">
            <CardBody>
              <div className="datagrid">
                <div className="datagrid-item">
                  <div className="datagrid-title">Customer</div>
                  <div className="datagrid-content">{order.customer_name}</div>
                </div>
                <div className="datagrid-item">
                  <div className="datagrid-title">Contact</div>
                  <div className="datagrid-content">{order.customer_contact}</div>
                </div>
                <div className="datagrid-item">
                  <div className="datagrid-title">Status</div>
                  <div className="datagrid-content">
                    <Badge color={orderStatusMeta(order.status).color}>
                      {orderStatusMeta(order.status).label}
                    </Badge>
                  </div>
                </div>
                <div className="datagrid-item">
                  <div className="datagrid-title">Order date</div>
                  <div className="datagrid-content">{order.ordered_at ? formatDateTime(order.ordered_at) : '—'}</div>
                </div>
                <div className="datagrid-item">
                  <div className="datagrid-title">Group</div>
                  <div className="datagrid-content d-flex align-items-center gap-2">
                    {order.group_id ? (
                      <>
                        <Link
                          to={`${ADMIN_PATHS.orderGroups}/${order.group_id}`}
                          className="d-inline-flex align-items-center gap-1"
                        >
                          View group #{order.group_id}
                          <IconChevronRight size={14} />
                        </Link>
                        {order.group_token && <code className="text-secondary">{order.group_token}</code>}
                      </>
                    ) : (
                      '—'
                    )}
                    <Button variant="outline-secondary" size="sm" onClick={() => setMoveOpen(true)}>
                      Move
                    </Button>
                  </div>
                </div>
                <div className="datagrid-item">
                  <div className="datagrid-title">Tax</div>
                  <div className="datagrid-content">
                    {taxPercent.toFixed(2)}% ({taxAmount.toFixed(2)})
                  </div>
                </div>
                <div className="datagrid-item">
                  <div className="datagrid-title">Total</div>
                  <div className="datagrid-content fw-bold">{grandTotal.toFixed(2)}</div>
                </div>
                <div className="datagrid-item">
                  <div className="datagrid-title">Created</div>
                  <div className="datagrid-content">{formatDateTime(order.created_at)}</div>
                </div>
                <div className="datagrid-item">
                  <div className="datagrid-title">Updated</div>
                  <div className="datagrid-content">{formatDateTime(order.updated_at)}</div>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody noPadding>
              <div className="card-header">
                <h3 className="card-title mb-0">Products ({items.length})</h3>
              </div>
              {items.length === 0 ? (
                <p className="text-secondary p-3 mb-0">No items.</p>
              ) : (
                <table className="table table-vcenter card-table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Attributes</th>
                      <th className="text-end">Price</th>
                      <th className="text-end">Qty</th>
                      <th className="text-end">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item) => (
                      <tr key={item.id}>
                        <td className="fw-medium">{item.product_name}</td>
                        <td>
                          {item.attributes?.length ? (
                            <div className="d-flex flex-wrap gap-1">
                              {item.attributes.map((attr) => (
                                <Badge key={`${attr.attribute_id}-${attr.option_id}`} color="blue-lt">
                                  {attr.attribute_name}: {attr.option_value}
                                  {Number(attr.price_delta ?? 0) !== 0 &&
                                    ` (${attr.price_delta > 0 ? '+' : '−'}${Math.abs(
                                      Number(attr.price_delta)
                                    ).toFixed(2)})`}
                                </Badge>
                              ))}
                            </div>
                          ) : (
                            <span className="text-secondary">—</span>
                          )}
                        </td>
                        <td className="text-end">{Number(item.price ?? 0).toFixed(2)}</td>
                        <td className="text-end">{item.quantity}</td>
                        <td className="text-end fw-medium">{lineTotalOf(item).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan={4} className="text-end text-secondary">
                        Subtotal
                      </td>
                      <td className="text-end text-secondary">{subtotal.toFixed(2)}</td>
                    </tr>
                    <tr>
                      <td colSpan={4} className="text-end text-secondary">
                        Tax ({taxPercent.toFixed(2)}%)
                      </td>
                      <td className="text-end text-secondary">{taxAmount.toFixed(2)}</td>
                    </tr>
                    <tr>
                      <td colSpan={4} className="text-end fw-bold">
                        Order total
                      </td>
                      <td className="text-end fw-bold">{grandTotal.toFixed(2)}</td>
                    </tr>
                  </tfoot>
                </table>
              )}
            </CardBody>
          </Card>
        </>
      )}

      <MoveOrderModal
        isOpen={isMoveOpen}
        onClose={() => setMoveOpen(false)}
        orderId={order?.id}
        currentGroupId={order?.group_id}
        onSubmit={(targetId) => setGroup(id, targetId)}
      />

      <OrderFormModal
        isOpen={isEditOpen}
        onClose={() => setEditOpen(false)}
        order={order}
        onSubmit={(payload) => update(id, payload)}
      />

      <ConfirmDialog
        isOpen={isConfirmOpen}
        message={`Delete order #${id} and all its items? This cannot be undone.`}
        onConfirm={handleDelete}
        onCancel={() => setConfirmOpen(false)}
      />
    </AdminLayout>
  );
}
