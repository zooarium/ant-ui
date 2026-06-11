import { apiRequest } from '@aviary-ui/core';

// Order status enum (swagger: 1=pending, 2=confirmed, 3=completed, 4=cancelled).
export const ORDER_STATUSES = [
  { value: 1, label: 'Pending', color: 'warning' },
  { value: 2, label: 'Confirmed', color: 'info' },
  { value: 3, label: 'Completed', color: 'success' },
  { value: 4, label: 'Cancelled', color: 'danger' },
];

export const orderStatusMeta = (status) =>
  ORDER_STATUSES.find((s) => s.value === status) ?? { value: status, label: `#${status}`, color: 'secondary' };

// filters: { limit, offset, status } — list is a summary (products_count only, no items).
export function fetchOrders(filters = {}) {
  const params = new URLSearchParams();
  params.append('limit', filters.limit ?? 50);
  params.append('offset', filters.offset ?? 0);
  if (filters.status !== undefined && filters.status !== '') params.append('status', filters.status);

  return apiRequest(`/orders?${params.toString()}`);
}

export function fetchOrder(id) {
  return apiRequest(`/orders/${id}`);
}

// payload: { customer_name, customer_contact, status?, products: [{ product_id, quantity, attributes: [{ attribute_id, option_id }] }] }
export function createOrder(payload) {
  return apiRequest('/orders', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

// Full sync: items with id update quantity only (product/attributes immutable),
// items without id are added, existing items missing from the payload are deleted.
// Status is NOT updatable here — use updateOrderStatus.
// payload: { customer_name, customer_contact, products: [{ id?, product_id?, quantity, attributes? }] }
export function updateOrder(id, payload) {
  return apiRequest(`/orders/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export function updateOrderStatus(id, status) {
  return apiRequest(`/orders/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

export function deleteOrder(id) {
  return apiRequest(`/orders/${id}`, { method: 'DELETE' });
}
