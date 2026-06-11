import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Button,
  Card,
  CardBody,
  Badge,
  Spinner,
  Select,
  IconPlus,
} from '@aviary-ui/ui';
import AdminLayout from '@/components/AdminLayout';
import ProductFormModal from '@/components/ProductFormModal';
import ListPagination from '@/components/ListPagination';
import { useProducts } from '@/hooks/useProducts';
import { ADMIN_PATHS } from '@/config/nav';

const LIMIT = 50;

export default function ProductsPage() {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState('');
  const [offset, setOffset] = useState(0);
  const [isAddOpen, setAddOpen] = useState(false);

  const { products, isLoading, error, refetch, create } = useProducts({
    limit: LIMIT,
    offset,
    status: statusFilter,
  });

  return (
    <AdminLayout>
      <div className="page-header d-print-none mb-3">
        <div className="row align-items-center">
          <div className="col">
            <h2 className="page-title">Products</h2>
          </div>
          <div className="col-auto ms-auto">
            <Button onClick={() => setAddOpen(true)} className="d-flex align-items-center gap-2">
              <IconPlus size={16} />
              New Product
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
                <option value="1">Active</option>
                <option value="0">Inactive</option>
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
          ) : products.length === 0 ? (
            <div className="p-5 text-center text-secondary">
              <p className="mb-3">No products found.</p>
              <Button onClick={() => setAddOpen(true)}>Add first product</Button>
            </div>
          ) : (
            <>
              <table className="table table-vcenter table-hover card-table">
                <thead>
                  <tr>
                    <th className="w-1">ID</th>
                    <th>Name</th>
                    <th>Price</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr
                      key={product.id}
                      role="button"
                      style={{ cursor: 'pointer' }}
                      onClick={() => navigate(`${ADMIN_PATHS.products}/${product.id}`)}
                    >
                      <td className="text-secondary">{product.id}</td>
                      <td className="fw-medium">{product.name}</td>
                      <td>{Number(product.price ?? 0).toFixed(2)}</td>
                      <td>
                        <Badge color={product.status === 1 ? 'success' : 'secondary'}>
                          {product.status === 1 ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <ListPagination
                offset={offset}
                limit={LIMIT}
                count={products.length}
                onChange={setOffset}
              />
            </>
          )}
        </CardBody>
      </Card>

      <ProductFormModal
        isOpen={isAddOpen}
        onClose={() => setAddOpen(false)}
        product={null}
        onSubmit={create}
      />
    </AdminLayout>
  );
}
