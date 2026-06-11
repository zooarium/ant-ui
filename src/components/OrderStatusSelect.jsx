import React, { useState } from 'react';
import { Select } from '@aviary-ui/ui';
import { ORDER_STATUSES } from '@/api/orders';

// Inline order-status dropdown — PATCHes /orders/{id}/status on change.
// Used in the orders list rows and on the order detail page.
// setStatus comes from useOrders(); success/error toasts are handled there.
export default function OrderStatusSelect({ order, setStatus, className = '' }) {
  const [isSaving, setSaving] = useState(false);

  const handleChange = async (e) => {
    const next = Number(e.target.value);
    if (next === order.status) return;
    setSaving(true);
    try {
      await setStatus(order.id, next);
    } catch {
      // Toast already shown by the mutation; query invalidation restores the real value.
    } finally {
      setSaving(false);
    }
  };

  return (
    <Select
      value={order.status}
      onChange={handleChange}
      disabled={isSaving}
      // Inside a clickable row: don't let interaction bubble into row navigation.
      onClick={(e) => e.stopPropagation()}
      className={className}
      aria-label="Order status"
    >
      {ORDER_STATUSES.map((s) => (
        <option key={s.value} value={s.value}>
          {s.label}
        </option>
      ))}
    </Select>
  );
}
