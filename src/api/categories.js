import { apiRequest } from '@aviary-ui/core';

// filters: { parent_id, status, limit, offset } — pagination is mandatory on
// list endpoints. The list is flat; hierarchy is reconstructed from path/parent_id.
export function fetchCategories(filters = {}) {
  const params = new URLSearchParams();
  params.append('limit', filters.limit ?? 50);
  params.append('offset', filters.offset ?? 0);
  if (filters.status !== undefined && filters.status !== '') params.append('status', filters.status);
  if (filters.parent_id !== undefined && filters.parent_id !== '')
    params.append('parent_id', filters.parent_id);

  return apiRequest(`/categories?${params.toString()}`);
}

export function fetchCategory(id) {
  return apiRequest(`/categories/${id}`);
}

// All categories in the subtree rooted at the given category.
export function fetchCategoryDescendants(id) {
  return apiRequest(`/categories/${id}/descendants`);
}

// payload: { name, parent_id? } — omit parent_id (or null) for a root category.
export function createCategory(payload) {
  return apiRequest('/categories', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

// payload: { name, status } — parent changes go through moveCategory.
export function updateCategory(id, payload) {
  return apiRequest(`/categories/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

// payload: { parent_id } — null parent_id promotes the category (and its
// subtree) to root.
export function moveCategory(id, payload) {
  return apiRequest(`/categories/${id}/move`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

// 409 when the category has children or assigned products.
export function deleteCategory(id) {
  return apiRequest(`/categories/${id}`, { method: 'DELETE' });
}
