import React from 'react';
import { Card, CardBody, Button, IconPlus } from '@aviary-ui/ui';
import { money } from '../lib/format';

// A single menu product. Tapping opens the option picker when it has attributes,
// otherwise adds straight to the cart.
export default function ProductCard({ product, onSelect }) {
  const hasOptions = (product.attributes ?? []).length > 0;
  return (
    <Card className="h-100">
      <CardBody className="d-flex flex-column">
        <div className="fw-bold">{product.name}</div>
        <div className="text-secondary mb-3">{money(product.price)}</div>
        <Button className="mt-auto" size="sm" onClick={() => onSelect(product)}>
          <IconPlus size={16} className="me-1" />
          {hasOptions ? 'Choose options' : 'Add'}
        </Button>
      </CardBody>
    </Card>
  );
}
