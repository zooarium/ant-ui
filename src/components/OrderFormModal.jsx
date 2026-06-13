import React, { useEffect, useState, useCallback, useRef } from 'react';
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
import ClearableInput from '@/components/ClearableInput';
import { TablePickerButton, TableNumberGrid } from '@/components/TablePicker';
import { useProducts, useProduct } from '@/hooks/useProducts';
import { useOrderGroups } from '@/hooks/useOrderGroups';
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
    unit_price: z.number().optional(), // existing item snapshot: (price + deltas) per unit
  })
  .superRefine((item, ctx) => {
    // Blank new rows (no product picked) are ignored on submit — don't flag them.
    // New orders open with several blank rows; the user fills only what they need.
    if (!item.item_id && (!item.product_id || item.product_id < 1)) return;
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
  status: z.coerce.number().int().min(1).max(5),
  tax_percent: z.coerce.number().min(0, 'Min 0').max(100, 'Max 100'),
  ordered_at: z.string().optional(),
  // Create-only grouping: group_id = '' → mint a new tab (group_label optional).
  group_id: z.string().optional(),
  group_label: z.string().max(100, 'Max 100 characters').optional(),
  products: z
    .array(itemSchema)
    .superRefine((items, ctx) => {
      // At least one usable row: an existing item or a new row with a product.
      const filled = items.filter((i) => i.item_id || (i.product_id ?? 0) >= 1);
      if (filled.length === 0) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Add at least one product' });
      }
    }),
});

// Fresh blank item rows (new objects each call so nested arrays aren't shared).
const makeItems = (n) =>
  Array.from({ length: n }, () => ({ product_id: 0, quantity: 1, attributes: [] }));

// New orders open with this many blank rows; the "Add" control appends more.
const NEW_ORDER_ITEMS = 5;
// Batch sizes offered by the "add rows" dropdown.
const ADD_COUNTS = [1, 2, 3, 4, 5, 8, 10];

const emptyValues = {
  customer_name: '',
  customer_contact: '',
  status: 1,
  tax_percent: 0,
  ordered_at: '',
  group_id: '',
  group_label: '',
  products: makeItems(NEW_ORDER_ITEMS),
};

// Format money delta for option labels: +0.50 / −0.50 / '' when zero.
const fmtDelta = (d) => {
  const n = Number(d ?? 0);
  if (!n) return '';
  return ` (${n > 0 ? '+' : '−'}${Math.abs(n).toFixed(2)})`;
};

// ISO timestamp → value for <input type="datetime-local"> (local "YYYY-MM-DDTHH:mm").
const toLocalInput = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (x) => String(x).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(
    d.getMinutes()
  )}`;
};

// Current local date+time as a datetime-local value — prefilled on new orders.
const nowLocalInput = () => toLocalInput(new Date());

// Recognizable group label derived from the customer: "Name (contact)".
const deriveGroupLabel = (name, contact) => {
  const n = (name ?? '').trim();
  const c = (contact ?? '').trim();
  if (n && c) return `${n} (${c})`;
  return n || c || '';
};

// New-item row: product picker + per-attribute option selects + quantity.
// Fetches the selected product's detail (attributes + options, with price deltas)
// and seeds the attribute selects whenever the product changes. Reports its live
// line total upward so the modal can show an estimated order total.
function NewItemRow({ index, fieldId, control, register, setValue, errors, activeProducts, onTotal, onRemove }) {
  const productId = useWatch({ control, name: `products.${index}.product_id` });
  const quantity = useWatch({ control, name: `products.${index}.quantity` });
  const watchedAttrs = useWatch({ control, name: `products.${index}.attributes` });
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

  // Live line total = (base price + selected option deltas) * quantity.
  const base = Number(product?.price ?? 0);
  const deltaSum = (product?.attributes ?? []).reduce((sum, attr, aIdx) => {
    const chosen = Number(watchedAttrs?.[aIdx]?.option_id ?? 0);
    if (!chosen) return sum;
    const opt = (attr.options ?? []).find((o) => o.id === chosen);
    return sum + Number(opt?.price_delta ?? 0);
  }, 0);
  const lineTotal = product ? (base + deltaSum) * Number(quantity || 0) : 0;

  useEffect(() => {
    onTotal(fieldId, lineTotal);
    return () => onTotal(fieldId, null);
  }, [fieldId, lineTotal, onTotal]);

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
                    {fmtDelta(opt.price_delta)}
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

      {product && (
        <div className="text-end text-secondary small mt-2">
          Line total: <span className="fw-medium">{lineTotal.toFixed(2)}</span>
        </div>
      )}
    </div>
  );
}

// Existing-item row (edit mode): product + attributes are immutable per the
// API — only quantity is editable; removing the row deletes the item on save.
// Line total follows the watched quantity using the snapshot unit price.
function ExistingItemRow({ index, fieldId, control, register, errors, item, onTotal, onRemove }) {
  const quantity = useWatch({ control, name: `products.${index}.quantity` });
  const lineTotal = Number(item.unit_price ?? 0) * Number(quantity || 0);

  useEffect(() => {
    onTotal(fieldId, lineTotal);
    return () => onTotal(fieldId, null);
  }, [fieldId, lineTotal, onTotal]);

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
      <div className="text-end text-secondary small mt-2">
        Line total: <span className="fw-medium">{lineTotal.toFixed(2)}</span>
      </div>
    </div>
  );
}

// Add + Edit modal for an order and its items.
// order = null → add mode (status + grouping selectable; only active products orderable).
// Edit (PUT) is a full item sync: rows with id update quantity only, rows
// without id are added, removed rows are deleted. Status is excluded — it is
// managed via PATCH /orders/{id}/status (OrderStatusSelect). Group is excluded —
// managed via PATCH /orders/{id}/group (MoveOrderModal).
// lockGroupId (create only): attach the new order to this group and hide the
// group picker — used when adding from a group's detail page.
export default function OrderFormModal({ isOpen, onClose, order, onSubmit, lockGroupId }) {
  const isEdit = !!order;
  const { showNotification } = useNotification();

  // Active products for the picker. 500 = API max page size.
  const { products: activeProducts } = useProducts({ limit: 500, offset: 0, status: 1 });
  // Existing tabs to optionally attach a new order to (create mode only).
  const { groups } = useOrderGroups({ limit: 500, offset: 0 });

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

  // Table-number picker for the new-group label: button sits by the label, grid
  // reveals in a full-width row below.
  const [tableOpen, setTableOpen] = useState(false);
  // How many blank rows the "Add" control appends at once.
  const [addCount, setAddCount] = useState(3);

  // Live per-row line totals → estimated order total. Keyed by RHF field id so
  // removed rows are pruned on effect cleanup.
  const [lineTotals, setLineTotals] = useState({});
  const onTotal = useCallback((fieldId, value) => {
    setLineTotals((prev) => {
      if (value === null) {
        if (!(fieldId in prev)) return prev;
        const next = { ...prev };
        delete next[fieldId];
        return next;
      }
      if (prev[fieldId] === value) return prev;
      return { ...prev, [fieldId]: value };
    });
  }, []);
  const subtotal = Object.values(lineTotals).reduce((a, b) => a + b, 0);
  const taxPercent = useWatch({ control, name: 'tax_percent' });
  const taxRate = Math.min(Math.max(Number(taxPercent) || 0, 0), 100);
  const taxAmount = (subtotal * taxRate) / 100;
  const estimatedTotal = subtotal + taxAmount;

  const groupId = useWatch({ control, name: 'group_id' });
  const customerName = useWatch({ control, name: 'customer_name' });
  const customerContact = useWatch({ control, name: 'customer_contact' });

  // Auto-fill the new-group label from name + contact as the user types, until
  // they edit the label by hand. Reset to auto on each open.
  const groupLabelEditedRef = useRef(false);

  useEffect(() => {
    if (isEdit || groupId || groupLabelEditedRef.current) return;
    setValue('group_label', deriveGroupLabel(customerName, customerContact));
  }, [isEdit, groupId, customerName, customerContact, setValue]);

  // Clear a manual/table-picked label and resume auto-fill from name + contact.
  const resetGroupLabel = () => {
    groupLabelEditedRef.current = false;
    setTableOpen(false);
    setValue('group_label', deriveGroupLabel(customerName, customerContact), { shouldValidate: true });
  };

  // Re-seed the form every time the modal opens. Row remounts on reset prune
  // their line-total entries via the onTotal cleanup, so no manual reset needed.
  useEffect(() => {
    if (!isOpen) return;
    groupLabelEditedRef.current = false;
    setTableOpen(false);
    setAddCount(3);
    reset(
      order
        ? {
            customer_name: order.customer_name,
            customer_contact: order.customer_contact,
            status: order.status,
            tax_percent: order.tax_percent ?? 0,
            ordered_at: toLocalInput(order.ordered_at),
            group_id: '',
            group_label: '',
            products: (order.products ?? []).map((item) => ({
              item_id: item.id,
              product_id: item.product_id,
              quantity: item.quantity,
              attributes: [],
              product_name: item.product_name,
              attr_summary: (item.attributes ?? [])
                .map((a) => `${a.attribute_name}: ${a.option_value}`)
                .join(', '),
              // Snapshot unit price for the line-total preview: prefer the API's
              // line_total/qty, else price + summed deltas.
              unit_price:
                item.quantity > 0 && item.line_total != null
                  ? item.line_total / item.quantity
                  : Number(item.price ?? 0) +
                    (item.attributes ?? []).reduce((s, a) => s + Number(a.price_delta ?? 0), 0),
            })),
          }
        : {
            ...emptyValues,
            products: makeItems(NEW_ORDER_ITEMS),
            ordered_at: nowLocalInput(),
            // Preselect + lock the group when adding from a group detail page.
            group_id: lockGroupId ? String(lockGroupId) : '',
          }
    );
  }, [isOpen, order, reset, lockGroupId]);

  const submit = async (values) => {
    const products = values.products
      // Drop blank new rows the user left untouched.
      .filter((item) => item.item_id || (item.product_id ?? 0) >= 1)
      .map((item) =>
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
      tax_percent: Number(values.tax_percent ?? 0),
      products,
      // ordered_at optional; send RFC3339 when set, omit to default to now.
      ...(values.ordered_at ? { ordered_at: new Date(values.ordered_at).toISOString() } : {}),
    };

    if (!isEdit) {
      // Status only on create — updates go through PATCH /orders/{id}/status.
      payload.status = values.status;
      // Grouping: attach to a chosen tab, else mint a new one. When no label is
      // typed, derive a recognizable one from the customer: "Name (contact)".
      if (values.group_id) {
        payload.group_id = Number(values.group_id);
      } else {
        payload.group_label =
          values.group_label?.trim() ||
          `${payload.customer_name} (${payload.customer_contact})`;
      }
    }

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

        <div className="row">
          <div className="col-md-4">
            <FormField label="Order date" htmlFor="orderedAt" error={errors.ordered_at?.message}>
              <Input id="orderedAt" type="datetime-local" {...register('ordered_at')} />
            </FormField>
          </div>
          <div className="col-md-4">
            <FormField label="Tax %" htmlFor="orderTax" error={errors.tax_percent?.message}>
              <Input
                id="orderTax"
                type="number"
                min="0"
                max="100"
                step="0.01"
                placeholder="0"
                error={errors.tax_percent?.message}
                {...register('tax_percent')}
              />
            </FormField>
          </div>
          {!isEdit && !lockGroupId && (
            <>
              <div className="col-md-4">
                <FormField label="Group" htmlFor="orderGroup">
                  <Select id="orderGroup" {...register('group_id')}>
                    <option value="">New group</option>
                    {groups.map((g) => (
                      <option key={g.id} value={g.id}>
                        #{g.id}
                        {g.label ? ` — ${g.label}` : ''}
                      </option>
                    ))}
                  </Select>
                </FormField>
              </div>
              {!groupId && (
                <>
                  <div className="col-md-4">
                    <FormField label="New group label" htmlFor="orderGroupLabel" error={errors.group_label?.message}>
                      {/* Inline clear resets the label and resumes auto-fill from name + contact. */}
                      <ClearableInput
                        id="orderGroupLabel"
                        type="text"
                        placeholder="auto from name + contact; edit to override"
                        error={errors.group_label?.message}
                        clearTitle="Reset label — resume auto-fill from name + contact"
                        onClear={resetGroupLabel}
                        {...register('group_label', {
                          onChange: () => {
                            groupLabelEditedRef.current = true;
                          },
                        })}
                      />
                      <TablePickerButton
                        className="mt-2"
                        open={tableOpen}
                        onToggle={() => setTableOpen((o) => !o)}
                      />
                    </FormField>
                  </div>
                  {tableOpen && (
                    <div className="col-12">
                      <TableNumberGrid
                        className="mb-3"
                        onSelect={(n) => {
                          groupLabelEditedRef.current = true;
                          setValue('group_label', `Table ${n}`, { shouldValidate: true });
                          setTableOpen(false);
                        }}
                      />
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>

        <div className="mb-3">
          <div className="d-flex align-items-center justify-content-between mb-2">
            <label className="form-label mb-0">Products</label>
            <div className="d-flex align-items-center gap-2">
              <Select
                value={addCount}
                onChange={(e) => setAddCount(Number(e.target.value))}
                aria-label="Rows to add"
                style={{ width: '4.5rem' }}
              >
                {ADD_COUNTS.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </Select>
              <Button
                variant="outline-secondary"
                size="sm"
                type="button"
                onClick={() => append(makeItems(addCount))}
                className="d-flex align-items-center gap-1"
              >
                <IconPlus size={14} />
                Add {addCount > 1 ? `${addCount} products` : 'product'}
              </Button>
            </div>
          </div>

          {errors.products?.root && (
            <div className="invalid-feedback d-block mb-2">{errors.products.root.message}</div>
          )}
          {errors.products?.message && (
            <div className="invalid-feedback d-block mb-2">{errors.products.message}</div>
          )}

          <div style={{ maxHeight: '45vh', overflowY: 'auto' }} className="pe-1">
          {fields.map((field, index) =>
            field.item_id ? (
              <ExistingItemRow
                key={field.id}
                index={index}
                fieldId={field.id}
                control={control}
                register={register}
                errors={errors}
                item={field}
                onTotal={onTotal}
                onRemove={() => remove(index)}
              />
            ) : (
              <NewItemRow
                key={field.id}
                index={index}
                fieldId={field.id}
                control={control}
                register={register}
                setValue={setValue}
                errors={errors}
                activeProducts={activeProducts}
                onTotal={onTotal}
                onRemove={() => remove(index)}
              />
            )
          )}
          </div>

          <div className="text-end mt-2">
            <div className="text-secondary small">Subtotal: {subtotal.toFixed(2)}</div>
            <div className="text-secondary small">
              Tax ({taxRate.toFixed(2)}%): {taxAmount.toFixed(2)}
            </div>
            <div className="fw-bold">Estimated total: {estimatedTotal.toFixed(2)}</div>
          </div>
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
