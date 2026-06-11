import React from 'react';
import { Card, CardBody } from '@aviary-ui/ui';
import AdminLayout from '@/components/AdminLayout';

export default function DashboardPage() {
  return (
    <AdminLayout>
      <div className="page-header d-print-none mb-3">
        <div className="row align-items-center">
          <div className="col">
            <h2 className="page-title">Dashboard</h2>
          </div>
        </div>
      </div>

      <Card>
        <CardBody>
          <p className="text-secondary mb-0">Replace this placeholder with your page content.</p>
        </CardBody>
      </Card>
    </AdminLayout>
  );
}
