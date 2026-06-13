// Thin wrappers over the public /public/* endpoints. Each returns the parsed
// { data, status } wrapper; callers read `.data`. Writes carry a reCAPTCHA action
// and the honeypot `website` field.
import { intakeRequest } from '../lib/http';

// Read-only display maps (public users only ever create status 1; reception sets the rest).
export const ORDER_STATUSES = [
  { value: 1, label: 'Pending', color: 'warning' },
  { value: 2, label: 'Confirmed', color: 'info' },
  { value: 3, label: 'Completed', color: 'success' },
  { value: 4, label: 'Cancelled', color: 'danger' },
  { value: 5, label: 'Paid', color: 'teal' },
];

export const TAB_STATUSES = [
  { value: 1, label: 'Open', color: 'info' },
  { value: 2, label: 'Closed', color: 'secondary' },
  { value: 3, label: 'Paid', color: 'success' },
  { value: 4, label: 'Cancelled', color: 'danger' },
];

export const orderStatusMeta = (s) =>
  ORDER_STATUSES.find((x) => x.value === s) ?? { value: s, label: `#${s}`, color: 'secondary' };
export const tabStatusMeta = (s) =>
  TAB_STATUSES.find((x) => x.value === s) ?? { value: s, label: `#${s}`, color: 'secondary' };

function listParams({ limit, offset } = {}) {
  const p = new URLSearchParams();
  p.append('limit', limit ?? 50);
  p.append('offset', offset ?? 0);
  return p;
}

export function fetchProducts(filters = {}) {
  return intakeRequest(`/public/products?${listParams(filters).toString()}`);
}

export function fetchProduct(id) {
  return intakeRequest(`/public/products/${id}`);
}

// payload: { label } — honeypot added here. Returns the minted tab with its token.
export function createOrderGroup(payload = {}) {
  return intakeRequest('/public/order-groups', {
    method: 'POST',
    recaptchaAction: 'create_group',
    body: { label: payload.label ?? '', website: payload.website ?? '' },
  });
}

// payload: { customer_name, customer_contact, device_id, group_id?, group_label?,
//            products: [{ product_id, quantity, attributes: [{ attribute_id, option_id }] }] }
// honeypot `website` is forced empty here. Omitting group_id mints a new tab and
// returns its token in order.group_token.
export function createOrder(payload) {
  return intakeRequest('/public/orders', {
    method: 'POST',
    recaptchaAction: 'create_order',
    body: { ...payload, website: '' },
  });
}

export function fetchTab(token) {
  return intakeRequest(`/public/order-groups/${encodeURIComponent(token)}`);
}

export function fetchHistory(deviceId, filters = {}) {
  const p = listParams(filters);
  p.append('device_id', deviceId);
  return intakeRequest(`/public/order-groups/history?${p.toString()}`);
}
