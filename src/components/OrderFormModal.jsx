import React, { useEffect } from 'react';
import { useForm, useFieldArray, useWatch } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Modal,
  Button,
  FormField,
  Input,
  Select,
  Badge,
  IconPlus,
  IconTrash,
  useNotification,
} from '@aviary-ui/ui';
import { useProducts, useProduct } from '@/hooks/useProducts';
import { ORDER_STATUSES } from '@/api/orders';

const itemSchema = z
  .object({
    // 'id' clashes with useFieldArray's internal key — use item_id in form state.
    item_id: z.number().optional(), // present = existing item (quantity-only edit per API)
    product_id: z.coerce.number().int(),
    quantity: z.coerce.number().int().min(1, 'Min 1'),
    attributes: z.array(
      z.object({
        attribute_id: z.number(),
        option_id: z.coerce.number().int(),
        // UI-only fields, stripped from the payload:
        is_mandatory: z.boolean(),
        name: z.string(),
      })
    ),
    // UI-only snapshot fields for read-only existing items:
    product_name: z.string().optional(),
    attr_summary: z.string().optional(),
  })
  .superRefine((item, ctx) => {
    if (!item.item_id && (!item.product_id || item.product_id < 1)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Pick a product', path: ['product_id'] });
    }
    item.attributes.forEach((a, i) => {
      if (a.is_mandatory && (!a.option_id || a.option_id < 1)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `${a.name} is required`,
          path: ['attributes', i, 'option_id'],
        });
      }
    });
  });

const orderSchema = z.object({
  customer_name: z.string().min(1, 'Name is required').max(100, 'Max 100 characters'),
  customer_contact: z.string().min(7, 'Min 7 characters').max(20, 'Max 20 characters'),
  status: z.coerce.number().int().min(1).max(4),
  products: z.array(itemSchema).min(1, 'Add at least one product'),
});

const emptyItem = { product_id: 0, quantity: 1, attributes: [] };
const emptyValues = { customer_name: '', customer_contact: '', status: 1, products: [{ ...emptyItem }] };

// New-item row: product picker + per-attribute option selects + quantity.
// Fetches the selected product's detail (attributes + options) and seeds the
// attribute selects whenever the product changes.
function NewItemRow({ index, control, register, setValue, errors, activeProducts, onRemove }) {
  const productId = useWatch({ control, name: `products.${index}.product_id` });
  const { product } = useProduct(Number(productId) >= 1 ? Number(productId) : null);

  // Seed attribute selects when the loaded product changes.
  useEffect(() => {
    if (!product) {
      setValue(`products.${index}.attributes`, []);
      return;
    }
    setValue(
      `products.${index}.attributes`,
      (product.attributes ?? []).map((a) => ({
        attribute_id: a.attribute_id,
        option_id: 0,
        is_mandatory: !!a.is_mandatory,
        name: a.name,
      }))
    );
  }, [product, index, setValue]);

  const itemErrors = errors.products?.[index];

  return (
    <div className="border rounded p-3 mb-2">
      <div className="d-flex gap-2 align-items-start">
        <div className="flex-fill">
          <Select error={itemErrors?.product_id?.message} {...register(`products.${index}.product_id`)}>
            <option value={0}>Select product…</option>
            {activeProducts.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} — {Number(p.price ?? 0).toFixed(2)}
              </option>
            ))}
          </Select>
          {itemErrors?.product_id && (
            <div className="invalid-feedback d-block">{itemErrors.product_id.message}</div>
          )}
        </div>
        <div style={{ width: '6rem' }}>
          <Input
            type="number"
            min="1"
            placeholder="Qty"
            error={itemErrors?.quantity?.message}
            {...register(`products.${index}.quantity`)}
          />
          {itemErrors?.quantity && (
            <div className="invalid-feedback d-block">{itemErrors.quantity.message}</div>
          )}
        </div>
        <Button variant="ghost-danger" icon type="button" onClick={onRemove} title="Remove item">
          <IconTrash size={16} />
        </Button>
      </div>

      {!!product?.attributes?.length && (
        <div className="row mt-2 g-2">
          {product.attributes.map((attr, aIdx) => (
            <div key={attr.attribute_id} className="col-md-4">
              <label className="form-label small mb-1">
                {attr.name}
                {attr.is_mandatory && <span className="text-danger"> *</span>}
              </label>
              <Select
                error={itemErrors?.attributes?.[aIdx]?.option_id?.message}
                {...register(`products.${index}.attributes.${aIdx}.option_id`)}
              >
                <option value={0}>Select…</option>
                {(attr.options ?? []).map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.value}
                  </option>
                ))}
              </Select>
              {itemErrors?.attributes?.[aIdx]?.option_id && (
                <div className="invalid-feedback d-block">
                  {itemErrors.attributes[aIdx].option_id.message}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Existing-item row (edit mode): product + attributes are immutable per the
// API — only quantity is editable; removing the row deletes the item on save.
function ExistingItemRow({ index, register, errors, item, onRemove }) {
  const itemErrors = errors.products?.[index];

  return (
    <div className="border rounded p-3 mb-2">
      <div className="d-flex gap-2 align-items-start">
        <div className="flex-fill">
          <div className="fw-medium">{item.product_name}</div>
          {item.attr_summary && <div className="text-secondary small">{item.attr_summary}</div>}
          <Badge color="azure-lt" className="mt-1">Existing — quantity only</Badge>
        </div>
        <div style={{ width: '6rem' }}>
          <Input
            type="number"
            min="1"
            placeholder="Qty"
            error={itemErrors?.quantity?.message}
            {...register(`products.${index}.quantity`)}
          />
          {itemErrors?.quantity && (
            <div className="invalid-feedback d-block">{itemErrors.quantity.message}</div>
          )}
        </div>
        <Button variant="ghost-danger" icon type="button" onClick={onRemove} title="Remove item">
          <IconTrash size={16} />
        </Button>
      </div>
    </div>
  );
}

// Add + Edit modal for an order and its items.
// order = null → add mode (status selectable; only active products orderable).
// Edit (PUT) is a full item sync: rows with id update quantity only, rows
// without id are added, removed rows are deleted. Status is excluded — it is
// managed via PATCH /orders/{id}/status (OrderStatusSelect).
export default function OrderFormModal({ isOpen, onClose, order, onSubmit }) {
  const isEdit = !!order;
  const { showNotification } = useNotification();

  // Active products for the picker. 500 = API max page size.
  const { products: activeProducts } = useProducts({ limit: 500, offset: 0, status: 1 });

  const {
    register,
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(orderSchema),
    defaultValues: emptyValues,
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'products' });

  // Re-seed the form every time the modal opens.
  useEffect(() => {
    if (!isOpen) return;
    reset(
      order
        ? {
            customer_name: order.customer_name,
            customer_contact: order.customer_contact,
            status: order.status,
            products: (order.products ?? []).map((item) => ({
              item_id: item.id,
              product_id: item.product_id,
              quantity: item.quantity,
              attributes: [],
              product_name: item.product_name,
              attr_summary: (item.attributes ?? [])
                .map((a) => `${a.attribute_name}: ${a.option_value}`)
                .join(', '),
            })),
          }
        : emptyValues
    );
  }, [isOpen, order, reset]);

  const submit = async (values) => {
    const products = values.products.map((item) =>
      item.item_id
        ? { id: item.item_id, quantity: item.quantity } // existing: quantity-only sync
        : {
            product_id: item.product_id,
            quantity: item.quantity,
            attributes: item.attributes
              .filter((a) => a.option_id >= 1) // optional attributes left unselected are omitted
              .map((a) => ({ attribute_id: a.attribute_id, option_id: a.option_id })),
          }
    );

    const payload = {
      customer_name: values.customer_name.trim(),
      customer_contact: values.customer_contact.trim(),
      products,
      // Status only on create — updates go through PATCH /orders/{id}/status.
      ...(isEdit ? {} : { status: values.status }),
    };

    try {
      await onSubmit(payload);
      onClose();
    } catch (err) {
      showNotification(err.message, 'error');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEdit ? 'Edit Order' : 'Add Order'} size="lg">
      <form onSubmit={handleSubmit(submit)} noValidate>
        <div className="row">
          <div className="col-md-5">
            <FormField label="Customer Name" htmlFor="orderCustomer" error={errors.customer_name?.message}>
              <Input
                id="orderCustomer"
                type="text"
                placeholder="e.g. John Doe"
                error={errors.customer_name?.message}
                {...register('customer_name')}
              />
            </FormField>
          </div>
          <div className="col-md-4">
            <FormField label="Contact" htmlFor="orderContact" error={errors.customer_contact?.message}>
              <Input
                id="orderContact"
                type="text"
                placeholder="Phone number"
                error={errors.customer_contact?.message}
                {...register('customer_contact')}
              />
            </FormField>
          </div>
          {!isEdit && (
            <div className="col-md-3">
              <FormField label="Status" htmlFor="orderStatus" error={errors.status?.message}>
                <Select id="orderStatus" error={errors.status?.message} {...register('status')}>
                  {ORDER_STATUSES.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </Select>
              </FormField>
            </div>
          )}
        </div>

        <div className="mb-3">
          <div className="d-flex align-items-center justify-content-between mb-2">
            <label className="form-label mb-0">Products</label>
            <Button
              variant="outline-secondary"
              size="sm"
              type="button"
              onClick={() => append({ ...emptyItem })}
              className="d-flex align-items-center gap-1"
            >
              <IconPlus size={14} />
              Add product
            </Button>
          </div>

          {errors.products?.root && (
            <div className="invalid-feedback d-block mb-2">{errors.products.root.message}</div>
          )}
          {errors.products?.message && (
            <div className="invalid-feedback d-block mb-2">{errors.products.message}</div>
          )}

          {fields.map((field, index) =>
            field.item_id ? (
              <ExistingItemRow
                key={field.id}
                index={index}
                register={register}
                errors={errors}
                item={field}
                onRemove={() => remove(index)}
              />
            ) : (
              <NewItemRow
                key={field.id}
                index={index}
                control={control}
                register={register}
                setValue={setValue}
                errors={errors}
                activeProducts={activeProducts}
                onRemove={() => remove(index)}
              />
            )
          )}
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
