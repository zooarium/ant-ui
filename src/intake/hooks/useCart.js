// Client-side cart — lives entirely in the browser; nothing hits the server until
// the final order submit. Lines with the same product + same option choices merge.
import { useReducer, useCallback, useMemo } from 'react';

// Stable signature for a line: product id + sorted chosen option ids.
function signature(productId, selections) {
  const opts = Object.values(selections)
    .map((o) => o.id)
    .sort((a, b) => a - b)
    .join(',');
  return `${productId}|${opts}`;
}

// lineTotal = (base price + Σ chosen option price_delta) × quantity.
export function lineTotal(item) {
  const deltas = Object.values(item.selections).reduce((sum, o) => sum + (o.price_delta ?? 0), 0);
  return (item.product.price + deltas) * item.quantity;
}

function reducer(state, action) {
  switch (action.type) {
    case 'add': {
      const { product, selections, quantity } = action;
      const sig = signature(product.id, selections);
      const existing = state.find((i) => i.sig === sig);
      if (existing) {
        return state.map((i) => (i.sig === sig ? { ...i, quantity: i.quantity + quantity } : i));
      }
      return [...state, { sig, product, selections, quantity }];
    }
    case 'setQty':
      return state
        .map((i) => (i.sig === action.sig ? { ...i, quantity: action.quantity } : i))
        .filter((i) => i.quantity > 0);
    case 'remove':
      return state.filter((i) => i.sig !== action.sig);
    case 'clear':
      return [];
    default:
      return state;
  }
}

export function useCart() {
  const [items, dispatch] = useReducer(reducer, []);

  const add = useCallback(
    (product, selections, quantity = 1) => dispatch({ type: 'add', product, selections, quantity }),
    []
  );
  const setQty = useCallback((sig, quantity) => dispatch({ type: 'setQty', sig, quantity }), []);
  const remove = useCallback((sig) => dispatch({ type: 'remove', sig }), []);
  const clear = useCallback(() => dispatch({ type: 'clear' }), []);

  const total = useMemo(() => items.reduce((sum, i) => sum + lineTotal(i), 0), [items]);
  const count = useMemo(() => items.reduce((sum, i) => sum + i.quantity, 0), [items]);

  // Shape the cart into the order payload's products array.
  const toOrderItems = useCallback(
    () =>
      items.map((i) => ({
        product_id: i.product.id,
        quantity: i.quantity,
        attributes: Object.entries(i.selections).map(([attribute_id, option]) => ({
          attribute_id: Number(attribute_id),
          option_id: option.id,
        })),
      })),
    [items]
  );

  return { items, add, setQty, remove, clear, total, count, toOrderItems };
}
