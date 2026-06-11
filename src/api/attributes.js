import { apiRequest } from '@aviary-ui/core';

// filters: { limit, offset, status } — pagination is mandatory on list endpoints.
export function fetchAttributes(filters = {}) {
  const params = new URLSearchParams();
  params.append('limit', filters.limit ?? 50);
  params.append('offset', filters.offset ?? 0);
  if (filters.status !== undefined && filters.status !== '') params.append('status', filters.status);

  return apiRequest(`/attributes?${params.toString()}`);
}

export function fetchAttribute(id) {
  return apiRequest(`/attributes/${id}`);
}

// payload: { name, status, options: [{ value }] }
export function createAttribute(payload) {
  return apiRequest('/attributes', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

// Full sync: options with id are updated, without id created, missing ones deleted.
// payload: { name, status, options: [{ id?, value }] }
export function updateAttribute(id, payload) {
  return apiRequest(`/attributes/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

// 409 when the attribute is assigned to a product.
export function deleteAttribute(id) {
  return apiRequest(`/attributes/${id}`, { method: 'DELETE' });
}
