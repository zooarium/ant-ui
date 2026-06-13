// Persistent per-browser device identifier — a soft returning-customer +
// rate-limit signal sent on order create and history reads. Not proof of identity.
const KEY = 'intake_device_id';

export function getDeviceId() {
  let id = localStorage.getItem(KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(KEY, id);
  }
  return id;
}
