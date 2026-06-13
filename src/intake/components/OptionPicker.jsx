import React, { useEffect, useMemo, useState } from 'react';
import { Modal, Button, FormField, Select } from '@aviary-ui/ui';
import { money } from '../lib/format';

// Option picker for a product with attributes. Mandatory attributes must have an
// option chosen before "Add" enables. Shows a live line total.
export default function OptionPicker({ product, onAdd, onClose }) {
  const [selections, setSelections] = useState({});
  const [quantity, setQuantity] = useState(1);

  // Reset whenever a different product opens the picker.
  useEffect(() => {
    setSelections({});
    setQuantity(1);
  }, [product?.id]);

  const attributes = product?.attributes ?? [];

  const choose = (attr, optionId) => {
    setSelections((prev) => {
      const next = { ...prev };
      if (!optionId) {
        delete next[attr.attribute_id];
      } else {
        next[attr.attribute_id] = attr.options.find((o) => o.id === Number(optionId));
      }
      return next;
    });
  };

  const missingMandatory = attributes.some(
    (a) => a.is_mandatory && !selections[a.attribute_id]
  );

  const lineTotal = useMemo(() => {
    const deltas = Object.values(selections).reduce((s, o) => s + (o.price_delta ?? 0), 0);
    return ((product?.price ?? 0) + deltas) * quantity;
  }, [selections, quantity, product]);

  if (!product) return null;

  return (
    <Modal isOpen={!!product} onClose={onClose} title={product.name}>
      {attributes.map((attr) => (
        <FormField
          key={attr.attribute_id}
          label={`${attr.name}${attr.is_mandatory ? ' *' : ''}`}
          htmlFor={`attr-${attr.attribute_id}`}
        >
          <Select
            id={`attr-${attr.attribute_id}`}
            value={selections[attr.attribute_id]?.id ?? ''}
            onChange={(e) => choose(attr, e.target.value)}
          >
            <option value="">{attr.is_mandatory ? 'Select…' : 'None'}</option>
            {attr.options.map((o) => (
              <option key={o.id} value={o.id}>
                {o.value}
                {o.price_delta ? ` (+${money(o.price_delta)})` : ''}
              </option>
            ))}
          </Select>
        </FormField>
      ))}

      <FormField label="Quantity" htmlFor="qty">
        <div className="d-flex align-items-center gap-2">
          <Button variant="outline-secondary" size="sm" onClick={() => setQuantity((q) => Math.max(1, q - 1))}>
            −
          </Button>
          <span className="fw-bold" style={{ minWidth: '2rem', textAlign: 'center' }}>
            {quantity}
          </span>
          <Button variant="outline-secondary" size="sm" onClick={() => setQuantity((q) => q + 1)}>
            +
          </Button>
        </div>
      </FormField>

      <div className="d-flex justify-content-between align-items-center mt-3">
        <span className="fw-bold">{money(lineTotal)}</span>
        <Button
          disabled={missingMandatory}
          onClick={() => {
            onAdd(product, selections, quantity);
            onClose();
          }}
        >
          Add to order
        </Button>
      </div>
    </Modal>
  );
}
