import React, { useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Modal,
  Button,
  FormField,
  Input,
  Select,
  IconPlus,
  IconTrash,
  useNotification,
} from '@aviary-ui/ui';

const attributeSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Max 100 characters'),
  status: z.coerce.number().int().min(0).max(1),
  options: z.array(
    z.object({
      id: z.number().optional(), // present = existing option (PUT updates it); absent = new
      value: z.string().min(1, 'Value is required').max(100, 'Max 100 characters'),
    })
  ),
});

const emptyValues = { name: '', status: 1, options: [{ value: '' }] };

// Add + Edit modal for an attribute and its options.
// attribute = null → add mode; attribute object → edit mode.
// On edit, options keep their id so the PUT full-sync updates them; rows
// removed here are omitted from the payload and the API deletes them.
export default function AttributeFormModal({ isOpen, onClose, attribute, onSubmit }) {
  const isEdit = !!attribute;
  const { showNotification } = useNotification();

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(attributeSchema),
    defaultValues: emptyValues,
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'options' });

  // Re-seed the form every time the modal opens.
  useEffect(() => {
    if (!isOpen) return;
    reset(
      attribute
        ? {
            name: attribute.name,
            status: attribute.status,
            options: (attribute.options ?? []).map((o) => ({ id: o.id, value: o.value })),
          }
        : emptyValues
    );
  }, [isOpen, attribute, reset]);

  const submit = async (values) => {
    const payload = {
      name: values.name.trim(),
      status: values.status,
      options: values.options.map((o) => (o.id ? { id: o.id, value: o.value.trim() } : { value: o.value.trim() })),
    };
    try {
      await onSubmit(payload);
      onClose();
    } catch (err) {
      showNotification(err.message, 'error');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEdit ? 'Edit Attribute' : 'Add Attribute'}>
      <form onSubmit={handleSubmit(submit)} noValidate>
        <FormField label="Name" htmlFor="attrName" error={errors.name?.message}>
          <Input
            id="attrName"
            type="text"
            placeholder="e.g. Size"
            error={errors.name?.message}
            {...register('name')}
          />
        </FormField>

        <FormField label="Status" htmlFor="attrStatus" error={errors.status?.message}>
          <Select id="attrStatus" error={errors.status?.message} {...register('status')}>
            <option value={1}>Active</option>
            <option value={0}>Inactive</option>
          </Select>
        </FormField>

        <div className="mb-3">
          <div className="d-flex align-items-center justify-content-between mb-2">
            <label className="form-label mb-0">Options</label>
            <Button
              variant="outline-secondary"
              size="sm"
              type="button"
              onClick={() => append({ value: '' })}
              className="d-flex align-items-center gap-1"
            >
              <IconPlus size={14} />
              Add option
            </Button>
          </div>

          {fields.length === 0 && <div className="text-secondary small mb-2">No options.</div>}

          {fields.map((field, index) => (
            <div key={field.id} className="d-flex gap-2 mb-2">
              <div className="flex-fill">
                <Input
                  type="text"
                  placeholder="e.g. Large"
                  error={errors.options?.[index]?.value?.message}
                  {...register(`options.${index}.value`)}
                />
                {errors.options?.[index]?.value && (
                  <div className="invalid-feedback d-block">{errors.options[index].value.message}</div>
                )}
              </div>
              <Button
                variant="ghost-danger"
                icon
                type="button"
                onClick={() => remove(index)}
                title="Remove option"
              >
                <IconTrash size={16} />
              </Button>
            </div>
          ))}
        </div>

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
