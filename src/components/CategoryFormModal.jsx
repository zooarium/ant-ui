import React, { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Modal,
  Button,
  FormField,
  Input,
  Select,
  useNotification,
} from '@aviary-ui/ui';

const categorySchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Max 100 characters'),
  parent_id: z.coerce.number().int().min(0),
  status: z.coerce.number().int().min(0).max(1),
});

const emptyValues = { name: '', parent_id: 0, status: 1 };

// Create/edit a category. On create, the parent is chosen here (0 = root). On
// edit, only name + status are editable — parent changes go through Move on the
// detail page (separate endpoint). `categories` supplies the parent dropdown,
// labelled by `display` so the hierarchy is visible.
export default function CategoryFormModal({ isOpen, onClose, category, categories = [], onSubmit }) {
  const isEdit = !!category;
  const { showNotification } = useNotification();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(categorySchema),
    defaultValues: emptyValues,
  });

  // A category cannot be its own parent. (Descendant cycles are rejected by the
  // API; this only guards the obvious self-pick — and parent isn't editable on
  // edit anyway.)
  const parentOptions = useMemo(
    () =>
      [...categories]
        .filter((c) => c.id !== category?.id)
        .sort((a, b) => (a.path ?? '').localeCompare(b.path ?? '')),
    [categories, category],
  );

  useEffect(() => {
    if (!isOpen) return;
    reset(
      category
        ? { name: category.name, parent_id: category.parent_id ?? 0, status: category.status }
        : emptyValues,
    );
  }, [isOpen, category, reset]);

  const submit = async (values) => {
    try {
      const payload = isEdit
        ? { name: values.name.trim(), status: values.status }
        : {
            name: values.name.trim(),
            // Omit parent_id for a root category.
            ...(values.parent_id ? { parent_id: values.parent_id } : {}),
          };
      await onSubmit(payload);
      onClose();
    } catch (err) {
      showNotification(err.message, 'error');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEdit ? 'Edit Category' : 'Add Category'}>
      <form onSubmit={handleSubmit(submit)} noValidate>
        <FormField label="Name" htmlFor="catName" error={errors.name?.message}>
          <Input
            id="catName"
            type="text"
            placeholder="e.g. Laptops"
            error={errors.name?.message}
            {...register('name')}
          />
        </FormField>

        {isEdit ? (
          <FormField label="Status" htmlFor="catStatus" error={errors.status?.message}>
            <Select id="catStatus" error={errors.status?.message} {...register('status')}>
              <option value={1}>Active</option>
              <option value={0}>Inactive</option>
            </Select>
          </FormField>
        ) : (
          <FormField label="Parent" htmlFor="catParent" error={errors.parent_id?.message}>
            <Select id="catParent" error={errors.parent_id?.message} {...register('parent_id')}>
              <option value={0}>— Root (no parent) —</option>
              {parentOptions.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.display}
                </option>
              ))}
            </Select>
          </FormField>
        )}

        <div className="d-flex justify-content-end gap-2">
          <Button variant="secondary" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={isSubmitting}>
            {isEdit ? 'Update' : 'Save'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
