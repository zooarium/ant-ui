import { apiRequest } from '@aviary-ui/core';

// Storefront is a singleton per app (profile-like): one GET, one PUT upsert.
// GET returns an empty active storefront if none saved yet.
export function fetchStorefront() {
  return apiRequest('/storefront');
}

// payload: { hero_image, gallery[], food_tags[], assessments[], status }
// PUT replaces the whole storefront — gallery/food_tags/assessments are synced
// by sending the full desired arrays (no per-item endpoints).
export function saveStorefront(payload) {
  return apiRequest('/storefront', {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}
