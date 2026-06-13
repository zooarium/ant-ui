import React, { useState } from 'react';
import { Select } from '@aviary-ui/ui';
import { ORDER_GROUP_STATUSES } from '@/api/orderGroups';

// Inline order-group status dropdown — PATCHes /order-groups/{id}/status on change.
// Used in the groups list rows and on the group detail page.
// setStatus(id, status) comes from useOrderGroups(); toasts handled there.
export default function OrderGroupStatusSelect({ group, setStatus, className = '' }) {
  const [isSaving, setSaving] = useState(false);

  const handleChange = async (e) => {
    const next = Number(e.target.value);
    if (next === group.status) return;
    setSaving(true);
    try {
      await setStatus(group.id, next);
    } catch {
      // Toast already shown by the mutation; query invalidation restores the real value.
    } finally {
      setSaving(false);
    }
  };

  return (
    <Select
      value={group.status}
      onChange={handleChange}
      disabled={isSaving}
      // Inside a clickable row: don't let interaction bubble into row navigation.
      onClick={(e) => e.stopPropagation()}
      className={className}
      aria-label="Group status"
    >
      {ORDER_GROUP_STATUSES.map((s) => (
        <option key={s.value} value={s.value}>
          {s.label}
        </option>
      ))}
    </Select>
  );
}
