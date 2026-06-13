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
import AttributeFormModal from '@/components/AttributeFormModal';
import { useAttribute, useAttributes } from '@/hooks/useAttributes';
import { ADMIN_PATHS } from '@/config/nav';
import { formatDateTime } from '@/utils/datetime';

export default function AttributeDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  const [isEditOpen, setEditOpen] = useState(false);
  const [isConfirmOpen, setConfirmOpen] = useState(false);

  const { attribute, isLoading, error, refetch } = useAttribute(id);
  const { update, remove } = useAttributes();

  const handleDelete = async () => {
    try {
      await remove(id);
      navigate(ADMIN_PATHS.attributes);
    } catch (err) {
      // 409 = assigned to a product — surfaced as-is from the API.
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
              to={ADMIN_PATHS.attributes}
              className="text-secondary d-inline-flex align-items-center gap-1 mb-1"
            >
              <IconArrowLeft size={16} />
              Attributes
            </Link>
            <h2 className="page-title">{attribute?.name ?? `Attribute #${id}`}</h2>
          </div>
          {attribute && (
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
      ) : !attribute ? (
        <Card>
          <CardBody>
            <p className="text-secondary mb-0">Attribute not found.</p>
          </CardBody>
        </Card>
      ) : (
        <>
          <Card className="mb-3">
            <CardBody>
              <div className="datagrid">
                <div className="datagrid-item">
                  <div className="datagrid-title">ID</div>
                  <div className="datagrid-content">{attribute.id}</div>
                </div>
                <div className="datagrid-item">
                  <div className="datagrid-title">Name</div>
                  <div className="datagrid-content">{attribute.name}</div>
                </div>
                <div className="datagrid-item">
                  <div className="datagrid-title">Status</div>
                  <div className="datagrid-content">
                    <Badge color={attribute.status === 1 ? 'success' : 'secondary'}>
                      {attribute.status === 1 ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </div>
                <div className="datagrid-item">
                  <div className="datagrid-title">Created</div>
                  <div className="datagrid-content">{formatDateTime(attribute.created_at)}</div>
                </div>
                <div className="datagrid-item">
                  <div className="datagrid-title">Updated</div>
                  <div className="datagrid-content">{formatDateTime(attribute.updated_at)}</div>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <h3 className="card-title mb-3">Options ({attribute.options?.length ?? 0})</h3>
              {!attribute.options?.length ? (
                <p className="text-secondary mb-0">No options defined.</p>
              ) : (
                <div className="d-flex flex-wrap gap-2">
                  {attribute.options.map((opt) => (
                    <Badge key={opt.id} color="blue-lt" className="fs-5">
                      {opt.value}
                    </Badge>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>
        </>
      )}

      <AttributeFormModal
        isOpen={isEditOpen}
        onClose={() => setEditOpen(false)}
        attribute={attribute}
        onSubmit={(payload) => update(id, payload)}
      />

      <ConfirmDialog
        isOpen={isConfirmOpen}
        message={`Delete attribute "${attribute?.name}" and all its options? This cannot be undone.`}
        onConfirm={handleDelete}
        onCancel={() => setConfirmOpen(false)}
      />
    </AdminLayout>
  );
}
