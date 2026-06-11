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
  useNotification,
} from '@aviary-ui/ui';
import AdminLayout from '@/components/AdminLayout';
import OrderFormModal from '@/components/OrderFormModal';
import OrderStatusSelect from '@/components/OrderStatusSelect';
import { useOrder, useOrders } from '@/hooks/useOrders';
import { orderStatusMeta } from '@/api/orders';
import { ADMIN_PATHS } from '@/config/nav';

export default function OrderDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  const [isEditOpen, setEditOpen] = useState(false);
  const [isConfirmOpen, setConfirmOpen] = useState(false);

  const { order, isLoading, error, refetch } = useOrder(id);
  const { update, remove, setStatus } = useOrders();

  const items = order?.products ?? [];
  const orderTotal = items.reduce((sum, item) => sum + (item.price ?? 0) * (item.quantity ?? 0), 0);

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
                  <div className="datagrid-title">Created</div>
                  <div className="datagrid-content">{order.created_at}</div>
                </div>
                <div className="datagrid-item">
                  <div className="datagrid-title">Updated</div>
                  <div className="datagrid-content">{order.updated_at}</div>
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
                                </Badge>
                              ))}
                            </div>
                          ) : (
                            <span className="text-secondary">—</span>
                          )}
                        </td>
                        <td className="text-end">{Number(item.price ?? 0).toFixed(2)}</td>
                        <td className="text-end">{item.quantity}</td>
                        <td className="text-end fw-medium">
                          {((item.price ?? 0) * (item.quantity ?? 0)).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan={4} className="text-end fw-bold">
                        Order total
                      </td>
                      <td className="text-end fw-bold">{orderTotal.toFixed(2)}</td>
                    </tr>
                  </tfoot>
                </table>
              )}
            </CardBody>
          </Card>
        </>
      )}

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
