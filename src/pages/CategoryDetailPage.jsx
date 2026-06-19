import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Button,
  Card,
  CardBody,
  Badge,
  Spinner,
  Modal,
  FormField,
  Select,
  ConfirmDialog,
  IconEdit,
  IconTrash,
  IconArrowLeft,
  useNotification,
} from '@aviary-ui/ui';
import AdminLayout from '@/components/AdminLayout';
import CategoryFormModal from '@/components/CategoryFormModal';
import { useCategory, useCategories } from '@/hooks/useCategories';
import { ADMIN_PATHS } from '@/config/nav';
import { formatDateTime } from '@/utils/datetime';

// Move a category (and its subtree) under a new parent. Self and descendants are
// excluded — moving into your own subtree would create a cycle (the API rejects
// it, but hiding the options avoids the error round-trip).
function MoveCategoryModal({ isOpen, onClose, category, categories, onMove }) {
  const { showNotification } = useNotification();
  const [parentId, setParentId] = useState(0);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) setParentId(category?.parent_id ?? 0);
  }, [isOpen, category]);

  const options = useMemo(() => {
    const selfPath = category?.path ?? '';
    return [...categories]
      .filter((c) => !selfPath || !(c.path ?? '').startsWith(selfPath))
      .sort((a, b) => (a.path ?? '').localeCompare(b.path ?? ''));
  }, [categories, category]);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      // null parent_id promotes to root.
      await onMove({ parent_id: parentId ? Number(parentId) : null });
      onClose();
    } catch (err) {
      showNotification(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Move Category">
      <form onSubmit={submit} noValidate>
        <FormField label="New parent" htmlFor="moveParent">
          <Select
            id="moveParent"
            value={parentId}
            onChange={(e) => setParentId(e.target.value)}
          >
            <option value={0}>— Root (no parent) —</option>
            {options.map((c) => (
              <option key={c.id} value={c.id}>
                {c.display}
              </option>
            ))}
          </Select>
        </FormField>
        <div className="d-flex justify-content-end gap-2">
          <Button variant="secondary" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={saving}>
            Move
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default function CategoryDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  const [isEditOpen, setEditOpen] = useState(false);
  const [isMoveOpen, setMoveOpen] = useState(false);
  const [isConfirmOpen, setConfirmOpen] = useState(false);

  const { category, isLoading, error, refetch } = useCategory(id);
  const { categories, update, move, remove } = useCategories({ limit: 500, offset: 0 });

  const handleDelete = async () => {
    try {
      await remove(id);
      navigate(ADMIN_PATHS.categories);
    } catch (err) {
      // 409 = has children or assigned products — surfaced as-is from the API.
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
              to={ADMIN_PATHS.categories}
              className="text-secondary d-inline-flex align-items-center gap-1 mb-1"
            >
              <IconArrowLeft size={16} />
              Categories
            </Link>
            <h2 className="page-title">{category?.name ?? `Category #${id}`}</h2>
          </div>
          {category && (
            <div className="col-auto ms-auto d-flex gap-2">
              <Button
                variant="outline-secondary"
                onClick={() => setEditOpen(true)}
                className="d-flex align-items-center gap-2"
              >
                <IconEdit size={16} />
                Edit
              </Button>
              <Button variant="outline-secondary" onClick={() => setMoveOpen(true)}>
                Move
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
      ) : !category ? (
        <Card>
          <CardBody>
            <p className="text-secondary mb-0">Category not found.</p>
          </CardBody>
        </Card>
      ) : (
        <Card className="mb-3">
          <CardBody>
            <div className="datagrid">
              <div className="datagrid-item">
                <div className="datagrid-title">ID</div>
                <div className="datagrid-content">{category.id}</div>
              </div>
              <div className="datagrid-item">
                <div className="datagrid-title">Name</div>
                <div className="datagrid-content">{category.name}</div>
              </div>
              <div className="datagrid-item">
                <div className="datagrid-title">Hierarchy</div>
                <div className="datagrid-content">{category.display}</div>
              </div>
              <div className="datagrid-item">
                <div className="datagrid-title">Path</div>
                <div className="datagrid-content">
                  <code>{category.path}</code>
                </div>
              </div>
              <div className="datagrid-item">
                <div className="datagrid-title">Depth</div>
                <div className="datagrid-content">{category.depth}</div>
              </div>
              <div className="datagrid-item">
                <div className="datagrid-title">Status</div>
                <div className="datagrid-content">
                  <Badge color={category.status === 1 ? 'success' : 'secondary'}>
                    {category.status === 1 ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </div>
              <div className="datagrid-item">
                <div className="datagrid-title">Created</div>
                <div className="datagrid-content">{formatDateTime(category.created_at)}</div>
              </div>
              <div className="datagrid-item">
                <div className="datagrid-title">Updated</div>
                <div className="datagrid-content">{formatDateTime(category.updated_at)}</div>
              </div>
            </div>
          </CardBody>
        </Card>
      )}

      <CategoryFormModal
        isOpen={isEditOpen}
        onClose={() => setEditOpen(false)}
        category={category}
        categories={categories}
        onSubmit={(payload) => update(id, payload)}
      />

      <MoveCategoryModal
        isOpen={isMoveOpen}
        onClose={() => setMoveOpen(false)}
        category={category}
        categories={categories}
        onMove={(payload) => move(id, payload)}
      />

      <ConfirmDialog
        isOpen={isConfirmOpen}
        message={`Delete category "${category?.name}"? This is blocked if it has children or assigned products.`}
        onConfirm={handleDelete}
        onCancel={() => setConfirmOpen(false)}
      />
    </AdminLayout>
  );
}
