import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Modal, Button, FormField, Input, useNotification } from '@aviary-ui/ui';
import TablePicker from '@/components/TablePicker';

// label is optional on both create and rename (API allows an unlabelled tab).
const groupSchema = z.object({
  label: z.string().max(100, 'Max 100 characters'),
});

const emptyValues = { label: '' };

// Add + rename modal for an order group (tab).
// group = null → create mode (POST). Status is managed via OrderGroupStatusSelect.
export default function OrderGroupFormModal({ isOpen, onClose, group, onSubmit }) {
  const isEdit = !!group;
  const { showNotification } = useNotification();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(groupSchema),
    defaultValues: emptyValues,
  });

  useEffect(() => {
    if (!isOpen) return;
    reset(group ? { label: group.label ?? '' } : emptyValues);
  }, [isOpen, group, reset]);

  const submit = async (values) => {
    try {
      await onSubmit({ label: values.label.trim() });
      onClose();
    } catch (err) {
      showNotification(err.message, 'error');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEdit ? 'Rename Group' : 'New Group'}>
      <form onSubmit={handleSubmit(submit)} noValidate>
        <FormField label="Label" htmlFor="groupLabel" error={errors.label?.message}>
          <Input
            id="groupLabel"
            type="text"
            placeholder="e.g. Table 5"
            error={errors.label?.message}
            {...register('label')}
          />
          <TablePicker
            className="mt-2"
            onSelect={(n) => setValue('label', `Table ${n}`, { shouldValidate: true })}
          />
        </FormField>

        <div className="d-flex justify-content-end gap-2">
          <Button variant="secondary" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={isSubmitting}>
            {isEdit ? 'Update' : 'Create'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
