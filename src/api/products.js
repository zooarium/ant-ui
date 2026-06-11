import { apiRequest } from '@aviary-ui/core';

// filters: { limit, offset, status } — pagination is mandatory on list endpoints.
export function fetchProducts(filters = {}) {
  const params = new URLSearchParams();
  params.append('limit', filters.limit ?? 50);
  params.append('offset', filters.offset ?? 0);
  if (filters.status !== undefined && filters.status !== '') params.append('status', filters.status);

  return apiRequest(`/products?${params.toString()}`);
}

export function fetchProduct(id) {
  return apiRequest(`/products/${id}`);
}

// payload: { name, price, status, attributes: [{ attribute_id, is_mandatory }] }
// Only active attributes can be assigned.
export function createProduct(payload) {
  return apiRequest('/products', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

// The attributes array replaces all assignments (full sync).
export function updateProduct(id, payload) {
  return apiRequest(`/products/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

// 409 when the product is used in any order.
export function deleteProduct(id) {
  return apiRequest(`/products/${id}`, { method: 'DELETE' });
}
