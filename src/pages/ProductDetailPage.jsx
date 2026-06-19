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
import ProductFormModal from '@/components/ProductFormModal';
import { useProduct, useProducts } from '@/hooks/useProducts';
import { ADMIN_PATHS } from '@/config/nav';
import { formatDateTime } from '@/utils/datetime';

export default function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  const [isEditOpen, setEditOpen] = useState(false);
  const [isConfirmOpen, setConfirmOpen] = useState(false);

  const { product, isLoading, error, refetch } = useProduct(id);
  const { update, remove } = useProducts();

  const handleDelete = async () => {
    try {
      await remove(id);
      navigate(ADMIN_PATHS.products);
    } catch (err) {
      // 409 = used in an order — surfaced as-is from the API.
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
              to={ADMIN_PATHS.products}
              className="text-secondary d-inline-flex align-items-center gap-1 mb-1"
            >
              <IconArrowLeft size={16} />
              Products
            </Link>
            <h2 className="page-title">{product?.name ?? `Product #${id}`}</h2>
          </div>
          {product && (
            <div className="col-auto ms-auto d-flex gap-2">
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
      ) : !product ? (
        <Card>
          <CardBody>
            <p className="text-secondary mb-0">Product not found.</p>
          </CardBody>
        </Card>
      ) : (
        <>
          <Card className="mb-3">
            <CardBody>
              <div className="datagrid">
                <div className="datagrid-item">
                  <div className="datagrid-title">ID</div>
                  <div className="datagrid-content">{product.id}</div>
                </div>
                <div className="datagrid-item">
                  <div className="datagrid-title">Name</div>
                  <div className="datagrid-content">{product.name}</div>
                </div>
                <div className="datagrid-item">
                  <div className="datagrid-title">Price</div>
                  <div className="datagrid-content">{Number(product.price ?? 0).toFixed(2)}</div>
                </div>
                <div className="datagrid-item">
                  <div className="datagrid-title">Category</div>
                  <div className="datagrid-content">
                    {product.category?.display ?? '—'}
                  </div>
                </div>
                <div className="datagrid-item">
                  <div className="datagrid-title">Status</div>
                  <div className="datagrid-content">
                    <Badge color={product.status === 1 ? 'success' : 'secondary'}>
                      {product.status === 1 ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </div>
                <div className="datagrid-item">
                  <div className="datagrid-title">Created</div>
                  <div className="datagrid-content">{formatDateTime(product.created_at)}</div>
                </div>
                <div className="datagrid-item">
                  <div className="datagrid-title">Updated</div>
                  <div className="datagrid-content">{formatDateTime(product.updated_at)}</div>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <h3 className="card-title mb-3">
                Attributes ({product.attributes?.length ?? 0})
              </h3>
              {!product.attributes?.length ? (
                <p className="text-secondary mb-0">No attributes assigned.</p>
              ) : (
                <div className="list-group list-group-flush">
                  {product.attributes.map((attr) => (
                    <div key={attr.attribute_id} className="list-group-item px-0">
                      <div className="d-flex align-items-center gap-2 mb-2">
                        <span className="fw-medium">{attr.name}</span>
                        {attr.is_mandatory && <Badge color="red-lt">Mandatory</Badge>}
                      </div>
                      <div className="d-flex flex-wrap gap-2">
                        {(attr.options ?? []).map((opt) => (
                          <Badge key={opt.id} color="blue-lt">
                            {opt.value}
                          </Badge>
                        ))}
                        {!attr.options?.length && (
                          <span className="text-secondary small">No options.</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>
        </>
      )}

      <ProductFormModal
        isOpen={isEditOpen}
        onClose={() => setEditOpen(false)}
        product={product}
        onSubmit={(payload) => update(id, payload)}
      />

      <ConfirmDialog
        isOpen={isConfirmOpen}
        message={`Delete product "${product?.name}" and its attribute assignments? This cannot be undone.`}
        onConfirm={handleDelete}
        onCancel={() => setConfirmOpen(false)}
      />
    </AdminLayout>
  );
}
