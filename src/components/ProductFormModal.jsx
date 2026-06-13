import React, { useEffect, useRef } from 'react';
import { useForm, useFieldArray, useWatch } from 'react-hook-form';
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
import { useAttributes, useAttribute } from '@/hooks/useAttributes';

const optionSchema = z.object({
  option_id: z.number().int(),
  value: z.string().optional(),
  _selected: z.boolean(),
  price_delta: z.coerce.number(),
});

const productSchema = z
  .object({
    name: z.string().min(1, 'Name is required').max(200, 'Max 200 characters'),
    price: z.coerce.number().min(0, 'Price must be 0 or more'),
    status: z.coerce.number().int().min(0).max(1),
    attributes: z.array(
      z.object({
        attribute_id: z.coerce.number().int().min(1, 'Pick an attribute'),
        is_mandatory: z.boolean(),
        options: z.array(optionSchema),
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

// One assigned-attribute row: attribute picker + mandatory flag + the allowed
// option subset with per-option price deltas. Loads the attribute's live option
// catalogue and merges it with the current form selections (preserving edits).
function AttributeAssignmentRow({ index, control, register, setValue, getValues, errors, activeAttributes, onRemove }) {
  const attributeId = useWatch({ control, name: `attributes.${index}.attribute_id` });
  const { attribute } = useAttribute(Number(attributeId) >= 1 ? Number(attributeId) : null);

  // Re-seed the row's option list whenever the loaded catalogue changes, merging
  // in any current selections/deltas. Guarded by a signature so user edits to the
  // checkboxes/deltas don't trigger a reseed loop.
  const seededRef = useRef('');
  useEffect(() => {
    if (Number(attributeId) < 1) {
      setValue(`attributes.${index}.options`, []);
      seededRef.current = `${attributeId}`;
      return;
    }
    if (!attribute) return;
    const catalogue = attribute.options ?? [];
    const sig = `${attributeId}:${catalogue.map((o) => o.id).join(',')}`;
    if (seededRef.current === sig) return;
    seededRef.current = sig;

    const current = getValues(`attributes.${index}.options`) ?? [];
    const merged = catalogue.map((o) => {
      const existing = current.find((c) => c.option_id === o.id);
      return {
        option_id: o.id,
        value: o.value,
        _selected: existing?._selected ?? false,
        price_delta: existing?.price_delta ?? 0,
      };
    });
    setValue(`attributes.${index}.options`, merged);
  }, [attributeId, attribute, index, setValue, getValues]);

  const options = useWatch({ control, name: `attributes.${index}.options` }) ?? [];
  const attrErrors = errors.attributes?.[index];

  return (
    <div className="border rounded p-3 mb-2">
      <div className="d-flex gap-2 align-items-start">
        <div className="flex-fill">
          <Select
            error={attrErrors?.attribute_id?.message}
            {...register(`attributes.${index}.attribute_id`)}
          >
            <option value={0}>Select attribute…</option>
            {activeAttributes.map((attr) => (
              <option key={attr.id} value={attr.id}>
                {attr.name}
              </option>
            ))}
          </Select>
          {attrErrors?.attribute_id && (
            <div className="invalid-feedback d-block">{attrErrors.attribute_id.message}</div>
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
        <Button variant="ghost-danger" icon type="button" onClick={onRemove} title="Remove attribute">
          <IconTrash size={16} />
        </Button>
      </div>

      {Number(attributeId) >= 1 && (
        <div className="mt-2">
          <div className="text-secondary small mb-1">Allowed options &amp; price deltas</div>
          {options.length === 0 ? (
            <div className="text-secondary small">This attribute has no options.</div>
          ) : (
            options.map((opt, oIdx) => (
              <div key={opt.option_id} className="d-flex align-items-center gap-2 mb-1">
                <label className="form-check mb-0" style={{ minWidth: '12rem' }}>
                  <input
                    type="checkbox"
                    className="form-check-input"
                    {...register(`attributes.${index}.options.${oIdx}._selected`)}
                  />
                  <span className="form-check-label">{opt.value}</span>
                </label>
                <div style={{ width: '8rem' }}>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="Δ price"
                    {...register(`attributes.${index}.options.${oIdx}.price_delta`)}
                  />
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

// Add + Edit modal for a product and its attribute assignments.
// product = null → add mode. The PUT attributes array replaces all assignments
// (full sync). Each assigned attribute carries the allowed option subset with
// per-option price deltas. Only active attributes are assignable.
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
    setValue,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(productSchema),
    defaultValues: emptyValues,
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'attributes' });

  // Re-seed the form every time the modal opens. Selected options are seeded
  // here; AttributeAssignmentRow merges them against the live catalogue on load.
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
              options: (a.options ?? []).map((o) => ({
                option_id: o.id,
                value: o.value,
                _selected: true,
                price_delta: o.price_delta ?? 0,
              })),
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
        options: (a.options ?? [])
          .filter((o) => o._selected)
          .map((o) => ({ option_id: o.option_id, price_delta: o.price_delta })),
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
    <Modal isOpen={isOpen} onClose={onClose} title={isEdit ? 'Edit Product' : 'Add Product'} size="lg">
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
              onClick={() => append({ attribute_id: 0, is_mandatory: false, options: [] })}
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
            <AttributeAssignmentRow
              key={field.id}
              index={index}
              control={control}
              register={register}
              setValue={setValue}
              getValues={getValues}
              errors={errors}
              activeAttributes={activeAttributes}
              onRemove={() => remove(index)}
            />
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
