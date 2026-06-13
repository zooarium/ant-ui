// Active tab persistence — keeps the current tab's {group_id, token} for the tab
// so "Add another order" attaches to the same tab. Cleared by "Start a new tab".
// sessionStorage: scoped to the browser tab, gone when it closes.
const KEY = 'intake_active_tab';

export function getActiveTab() {
  try {
    const raw = sessionStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setActiveTab(tab) {
  if (!tab?.token) return;
  sessionStorage.setItem(KEY, JSON.stringify({ group_id: tab.group_id, token: tab.token }));
}

export function clearActiveTab() {
  sessionStorage.removeItem(KEY);
}

// Remembers the customer's name + contact across orders in this browser tab so
// "Add another order" pre-fills them. localStorage: survives across visits too.
const CUSTOMER_KEY = 'intake_customer';

export function getCustomer() {
  try {
    const raw = localStorage.getItem(CUSTOMER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setCustomer({ customer_name, customer_contact } = {}) {
  if (!customer_name && !customer_contact) return;
  try {
    localStorage.setItem(CUSTOMER_KEY, JSON.stringify({ customer_name, customer_contact }));
  } catch {
    /* storage unavailable — pre-fill is best-effort */
  }
}
