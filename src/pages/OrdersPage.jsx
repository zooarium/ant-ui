import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Button,
  Card,
  CardBody,
  Spinner,
  Select,
  IconPlus,
} from '@aviary-ui/ui';
import AdminLayout from '@/components/AdminLayout';
import OrderFormModal from '@/components/OrderFormModal';
import OrderStatusSelect from '@/components/OrderStatusSelect';
import ListPagination from '@/components/ListPagination';
import { useOrders } from '@/hooks/useOrders';
import { ORDER_STATUSES } from '@/api/orders';
import { ADMIN_PATHS } from '@/config/nav';

const LIMIT = 50;

export default function OrdersPage() {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState('');
  const [offset, setOffset] = useState(0);
  const [isAddOpen, setAddOpen] = useState(false);

  const { orders, isLoading, error, refetch, create, setStatus } = useOrders({
    limit: LIMIT,
    offset,
    status: statusFilter,
  });

  return (
    <AdminLayout>
      <div className="page-header d-print-none mb-3">
        <div className="row align-items-center">
          <div className="col">
            <h2 className="page-title">Orders</h2>
          </div>
          <div className="col-auto ms-auto">
            <Button onClick={() => setAddOpen(true)} className="d-flex align-items-center gap-2">
              <IconPlus size={16} />
              New Order
            </Button>
          </div>
        </div>
      </div>

      <Card className="mb-3">
        <CardBody>
          <div className="row">
            <div className="col-md-3">
              <Select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setOffset(0);
                }}
                aria-label="Filter by status"
              >
                <option value="">All statuses</option>
                {ORDER_STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </Select>
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
          ) : orders.length === 0 ? (
            <div className="p-5 text-center text-secondary">
              <p className="mb-3">No orders found.</p>
              <Button onClick={() => setAddOpen(true)}>Add first order</Button>
            </div>
          ) : (
            <>
              <table className="table table-vcenter table-hover card-table">
                <thead>
                  <tr>
                    <th className="w-1">ID</th>
                    <th>Customer</th>
                    <th>Contact</th>
                    <th>Products</th>
                    <th style={{ width: '11rem' }}>Status</th>
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
                      <td className="text-secondary">{order.customer_contact}</td>
                      <td className="text-secondary">{order.products_count ?? 0}</td>
                      <td>
                        <OrderStatusSelect order={order} setStatus={setStatus} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <ListPagination
                offset={offset}
                limit={LIMIT}
                count={orders.length}
                onChange={setOffset}
              />
            </>
          )}
        </CardBody>
      </Card>

      <OrderFormModal
        isOpen={isAddOpen}
        onClose={() => setAddOpen(false)}
        order={null}
        onSubmit={create}
      />
    </AdminLayout>
  );
}
