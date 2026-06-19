import React, { useMemo, useState } from 'react';
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
import CategoryFormModal from '@/components/CategoryFormModal';
import { useCategories } from '@/hooks/useCategories';
import { ADMIN_PATHS } from '@/config/nav';

// Tree view: fetch the full set (API max page size) and sort by materialized
// path so parents precede their children. Offset paging would fragment the
// hierarchy, so it is intentionally omitted here.
const LIMIT = 500;

export default function CategoriesPage() {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState('');
  const [isAddOpen, setAddOpen] = useState(false);

  const { categories, isLoading, error, refetch, create } = useCategories({
    limit: LIMIT,
    offset: 0,
    status: statusFilter,
  });

  // Path sort gives natural tree order (e.g. /5/, /5/7/, /5/7/8/, /6/).
  const sorted = useMemo(
    () => [...categories].sort((a, b) => (a.path ?? '').localeCompare(b.path ?? '')),
    [categories],
  );

  return (
    <AdminLayout>
      <div className="page-header d-print-none mb-3">
        <div className="row align-items-center">
          <div className="col">
            <h2 className="page-title">Categories</h2>
          </div>
          <div className="col-auto ms-auto">
            <Button onClick={() => setAddOpen(true)} className="d-flex align-items-center gap-2">
              <IconPlus size={16} />
              New Category
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
                onChange={(e) => setStatusFilter(e.target.value)}
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
          ) : sorted.length === 0 ? (
            <div className="p-5 text-center text-secondary">
              <p className="mb-3">No categories found.</p>
              <Button onClick={() => setAddOpen(true)}>Add first category</Button>
            </div>
          ) : (
            <table className="table table-vcenter table-hover card-table">
              <thead>
                <tr>
                  <th className="w-1">ID</th>
                  <th>Name</th>
                  <th>Hierarchy</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((cat) => (
                  <tr
                    key={cat.id}
                    role="button"
                    style={{ cursor: 'pointer' }}
                    onClick={() => navigate(`${ADMIN_PATHS.categories}/${cat.id}`)}
                  >
                    <td className="text-secondary">{cat.id}</td>
                    <td className="fw-medium">
                      {/* Indent by depth to convey the tree visually. */}
                      <span style={{ paddingLeft: `${(cat.depth ?? 0) * 1.25}rem` }}>
                        {(cat.depth ?? 0) > 0 && <span className="text-secondary me-1">└</span>}
                        {cat.name}
                      </span>
                    </td>
                    <td className="text-secondary">{cat.display}</td>
                    <td>
                      <Badge color={cat.status === 1 ? 'success' : 'secondary'}>
                        {cat.status === 1 ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardBody>
      </Card>

      <CategoryFormModal
        isOpen={isAddOpen}
        onClose={() => setAddOpen(false)}
        category={null}
        categories={categories}
        onSubmit={create}
      />
    </AdminLayout>
  );
}
