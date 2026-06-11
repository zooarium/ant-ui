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
import AttributeFormModal from '@/components/AttributeFormModal';
import ListPagination from '@/components/ListPagination';
import { useAttributes } from '@/hooks/useAttributes';
import { ADMIN_PATHS } from '@/config/nav';

const LIMIT = 50;

export default function AttributesPage() {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState('');
  const [offset, setOffset] = useState(0);
  const [isAddOpen, setAddOpen] = useState(false);

  const { attributes, isLoading, error, refetch, create } = useAttributes({
    limit: LIMIT,
    offset,
    status: statusFilter,
  });

  return (
    <AdminLayout>
      <div className="page-header d-print-none mb-3">
        <div className="row align-items-center">
          <div className="col">
            <h2 className="page-title">Attributes</h2>
          </div>
          <div className="col-auto ms-auto">
            <Button onClick={() => setAddOpen(true)} className="d-flex align-items-center gap-2">
              <IconPlus size={16} />
              New Attribute
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
          ) : attributes.length === 0 ? (
            <div className="p-5 text-center text-secondary">
              <p className="mb-3">No attributes found.</p>
              <Button onClick={() => setAddOpen(true)}>Add first attribute</Button>
            </div>
          ) : (
            <>
              <table className="table table-vcenter table-hover card-table">
                <thead>
                  <tr>
                    <th className="w-1">ID</th>
                    <th>Name</th>
                    <th>Options</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {attributes.map((attr) => (
                    <tr
                      key={attr.id}
                      role="button"
                      style={{ cursor: 'pointer' }}
                      onClick={() => navigate(`${ADMIN_PATHS.attributes}/${attr.id}`)}
                    >
                      <td className="text-secondary">{attr.id}</td>
                      <td className="fw-medium">{attr.name}</td>
                      <td className="text-secondary">{attr.options?.length ?? 0}</td>
                      <td>
                        <Badge color={attr.status === 1 ? 'success' : 'secondary'}>
                          {attr.status === 1 ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <ListPagination
                offset={offset}
                limit={LIMIT}
                count={attributes.length}
                onChange={setOffset}
              />
            </>
          )}
        </CardBody>
      </Card>

      <AttributeFormModal
        isOpen={isAddOpen}
        onClose={() => setAddOpen(false)}
        attribute={null}
        onSubmit={create}
      />
    </AdminLayout>
  );
}
