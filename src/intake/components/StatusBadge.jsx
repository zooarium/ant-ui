import React from 'react';
import { Badge } from '@aviary-ui/ui';
import { orderStatusMeta, tabStatusMeta } from '../api/public';

// Read-only status badge. kind: 'order' (default) or 'tab'.
export default function StatusBadge({ status, kind = 'order' }) {
  const meta = kind === 'tab' ? tabStatusMeta(status) : orderStatusMeta(status);
  return <Badge color={meta.color}>{meta.label}</Badge>;
}
