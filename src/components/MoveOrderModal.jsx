import React, { useState } from 'react';
import { Modal, Button, FormField, Select, Spinner, useNotification } from '@aviary-ui/ui';
import { useOrderGroups } from '@/hooks/useOrderGroups';

// Move an order to another group (tab). Orders cannot be detached, only moved.
// onSubmit(targetGroupId) — caller wires setGroup(orderId, targetGroupId).
// currentGroupId is excluded from the target list.
export default function MoveOrderModal({ isOpen, onClose, orderId, currentGroupId, onSubmit }) {
  const { showNotification } = useNotification();
  const [target, setTarget] = useState('');
  const [isSaving, setSaving] = useState(false);

  // 500 = API max page size; enough to pick a destination tab.
  const { groups, isLoading } = useOrderGroups({ limit: 500, offset: 0 });

  const candidates = groups.filter((g) => g.id !== currentGroupId);

  // Clear the selection on close so the next open starts fresh.
  const close = () => {
    setTarget('');
    onClose();
  };

  const submit = async () => {
    const groupId = Number(target);
    if (!groupId) return;
    setSaving(true);
    try {
      await onSubmit(groupId);
      close();
    } catch (err) {
      showNotification(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={close} title={`Move order #${orderId}`}>
      {isLoading ? (
        <Spinner centered />
      ) : (
        <>
          <FormField label="Destination group" htmlFor="moveTarget">
            <Select id="moveTarget" value={target} onChange={(e) => setTarget(e.target.value)}>
              <option value="">Select a group…</option>
              {candidates.map((g) => (
                <option key={g.id} value={g.id}>
                  #{g.id}
                  {g.label ? ` — ${g.label}` : ''} ({g.token})
                </option>
              ))}
            </Select>
          </FormField>
          {candidates.length === 0 && (
            <p className="text-secondary small">No other groups available. Create one first.</p>
          )}

          <div className="d-flex justify-content-end gap-2">
            <Button variant="secondary" type="button" onClick={close}>
              Cancel
            </Button>
            <Button type="button" onClick={submit} loading={isSaving} disabled={!target}>
              Move
            </Button>
          </div>
        </>
      )}
    </Modal>
  );
}
