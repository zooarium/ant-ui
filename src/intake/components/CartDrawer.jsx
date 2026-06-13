import React from 'react';
import { Card, CardHeader, CardTitle, CardBody, Button, IconTrash } from '@aviary-ui/ui';
import { money } from '../lib/format';
import { lineTotal } from '../hooks/useCart';

// Cart summary with per-line quantity controls and the running total.
export default function CartDrawer({ cart, onContinue }) {
  const { items, setQty, remove, total } = cart;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your order</CardTitle>
      </CardHeader>
      <CardBody>
        {!items.length ? (
          <p className="text-secondary mb-0">Tap items on the menu to add them here.</p>
        ) : (
          <>
            {items.map((item) => {
              const opts = Object.values(item.selections).map((o) => o.value).join(', ');
              return (
                <div key={item.sig} className="d-flex justify-content-between align-items-start mb-3">
                  <div className="me-2">
                    <div className="fw-bold">{item.product.name}</div>
                    {opts && <div className="text-secondary small">{opts}</div>}
                    <div className="d-flex align-items-center gap-2 mt-1">
                      <Button variant="outline-secondary" size="sm" onClick={() => setQty(item.sig, item.quantity - 1)}>
                        −
                      </Button>
                      <span style={{ minWidth: '1.5rem', textAlign: 'center' }}>{item.quantity}</span>
                      <Button variant="outline-secondary" size="sm" onClick={() => setQty(item.sig, item.quantity + 1)}>
                        +
                      </Button>
                      <Button variant="ghost-danger" size="sm" icon onClick={() => remove(item.sig)} aria-label="Remove">
                        <IconTrash size={16} />
                      </Button>
                    </div>
                  </div>
                  <div className="fw-bold text-nowrap">{money(lineTotal(item))}</div>
                </div>
              );
            })}

            <hr />
            <div className="d-flex justify-content-between fw-bold fs-3 mb-3">
              <span>Total</span>
              <span>{money(total)}</span>
            </div>
            <Button className="w-100" onClick={onContinue}>
              Continue to details
            </Button>
          </>
        )}
      </CardBody>
    </Card>
  );
}
