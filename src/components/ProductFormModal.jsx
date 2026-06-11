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
import { useAttributes } from '@/hooks/useAttributes';

const productSchema = z
  .object({
    name: z.string().min(1, 'Name is required').max(200, 'Max 200 characters'),
    price: z.coerce.number().min(0, 'Price must be 0 or more'),
    status: z.coerce.number().int().min(0).max(1),
    attributes: z.array(
      z.object({
        attribute_id: z.coerce.number().int().min(1, 'Pick an attribute'),
        is_mandatory: z.boolean(),
      })
    ),
  })
  .superRefine((values, ctx) => {
    const seen = new Set();
    values.attributes.forEach((a, i) => {
      if (seen.has(a.attribute_id)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Attribute already assigned',
          path: ['attributes', i, 'attribute_id'],
        });
      }
      seen.add(a.attribute_id);
    });
  });

const emptyValues = { name: '', price: 0, status: 1, attributes: [] };

// Add + Edit modal for a product and its attribute assignments.
// product = null → add mode. The PUT attributes array replaces all assignments
// (full sync), so rows removed here are unassigned on save.
// Only active attributes are assignable (API enforces; picker lists status=1 only).
export default function ProductFormModal({ isOpen, onClose, product, onSubmit }) {
  const isEdit = !!product;
  const { showNotification } = useNotification();

  // Active attributes for the picker. 500 = API max page size.
  const { attributes: activeAttributes } = useAttributes({ limit: 500, offset: 0, status: 1 });

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(productSchema),
    defaultValues: emptyValues,
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'attributes' });

  // Re-seed the form every time the modal opens.
  useEffect(() => {
    if (!isOpen) return;
    reset(
      product
        ? {
            name: product.name,
            price: product.price ?? 0,
            status: product.status,
            attributes: (product.attributes ?? []).map((a) => ({
              attribute_id: a.attribute_id,
              is_mandatory: !!a.is_mandatory,
            })),
          }
        : emptyValues
    );
  }, [isOpen, product, reset]);

  const submit = async (values) => {
    const payload = {
      name: values.name.trim(),
      price: values.price,
      status: values.status,
      attributes: values.attributes.map((a) => ({
        attribute_id: a.attribute_id,
        is_mandatory: a.is_mandatory,
      })),
    };
    try {
      await onSubmit(payload);
      onClose();
    } catch (err) {
      showNotification(err.message, 'error');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEdit ? 'Edit Product' : 'Add Product'}>
      <form onSubmit={handleSubmit(submit)} noValidate>
        <FormField label="Name" htmlFor="productName" error={errors.name?.message}>
          <Input
            id="productName"
            type="text"
            placeholder="e.g. T-Shirt"
            error={errors.name?.message}
            {...register('name')}
          />
        </FormField>

        <div className="row">
          <div className="col-6">
            <FormField label="Price" htmlFor="productPrice" error={errors.price?.message}>
              <Input
                id="productPrice"
                type="number"
                step="0.01"
                min="0"
                error={errors.price?.message}
                {...register('price')}
              />
            </FormField>
          </div>
          <div className="col-6">
            <FormField label="Status" htmlFor="productStatus" error={errors.status?.message}>
              <Select id="productStatus" error={errors.status?.message} {...register('status')}>
                <option value={1}>Active</option>
                <option value={0}>Inactive</option>
              </Select>
            </FormField>
          </div>
        </div>

        <div className="mb-3">
          <div className="d-flex align-items-center justify-content-between mb-2">
            <label className="form-label mb-0">Attributes</label>
            <Button
              variant="outline-secondary"
              size="sm"
              type="button"
              onClick={() => append({ attribute_id: 0, is_mandatory: false })}
              className="d-flex align-items-center gap-1"
            >
              <IconPlus size={14} />
              Assign attribute
            </Button>
          </div>

          {fields.length === 0 && (
            <div className="text-secondary small mb-2">No attributes assigned.</div>
          )}

          {fields.map((field, index) => (
            <div key={field.id} className="d-flex gap-2 mb-2 align-items-start">
              <div className="flex-fill">
                <Select
                  error={errors.attributes?.[index]?.attribute_id?.message}
                  {...register(`attributes.${index}.attribute_id`)}
                >
                  <option value={0}>Select attribute…</option>
                  {activeAttributes.map((attr) => (
                    <option key={attr.id} value={attr.id}>
                      {attr.name}
                    </option>
                  ))}
                </Select>
                {errors.attributes?.[index]?.attribute_id && (
                  <div className="invalid-feedback d-block">
                    {errors.attributes[index].attribute_id.message}
                  </div>
                )}
              </div>
              <label className="form-check form-check-inline mt-2 mb-0 text-nowrap">
                <input
                  type="checkbox"
                  className="form-check-input"
                  {...register(`attributes.${index}.is_mandatory`)}
                />
                <span className="form-check-label">Mandatory</span>
              </label>
              <Button
                variant="ghost-danger"
                icon
                type="button"
                onClick={() => remove(index)}
                title="Remove attribute"
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
