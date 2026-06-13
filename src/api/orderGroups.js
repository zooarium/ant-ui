import { apiRequest } from '@aviary-ui/core';

// Order-group status enum (swagger: 1=open, 2=closed, 3=paid, 4=cancelled).
export const ORDER_GROUP_STATUSES = [
  { value: 1, label: 'Open', color: 'info' },
  { value: 2, label: 'Closed', color: 'secondary' },
  { value: 3, label: 'Paid', color: 'success' },
  { value: 4, label: 'Cancelled', color: 'danger' },
];

export const orderGroupStatusMeta = (status) =>
  ORDER_GROUP_STATUSES.find((s) => s.value === status) ?? {
    value: status,
    label: `#${status}`,
    color: 'secondary',
  };

// filters: { limit, offset, status } — list is a summary (orders_count only, no member orders).
export function fetchOrderGroups(filters = {}) {
  const params = new URLSearchParams();
  params.append('limit', filters.limit ?? 50);
  params.append('offset', filters.offset ?? 0);
  if (filters.status !== undefined && filters.status !== '') params.append('status', filters.status);

  return apiRequest(`/order-groups?${params.toString()}`);
}

// Detail read: includes member orders + combined total.
export function fetchOrderGroup(id) {
  return apiRequest(`/order-groups/${id}`);
}

// payload: { label? } — a unique token is generated server-side.
export function createOrderGroup(payload) {
  return apiRequest('/order-groups', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

// Only the label is updatable here; status is managed via updateOrderGroupStatus.
export function updateOrderGroup(id, payload) {
  return apiRequest(`/order-groups/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export function updateOrderGroupStatus(id, status) {
  return apiRequest(`/order-groups/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

// 409 when the group still has orders — only empty groups can be deleted.
export function deleteOrderGroup(id) {
  return apiRequest(`/order-groups/${id}`, { method: 'DELETE' });
}
