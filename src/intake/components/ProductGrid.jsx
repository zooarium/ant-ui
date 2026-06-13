import React from 'react';
import ProductCard from './ProductCard';

export default function ProductGrid({ products, onSelect }) {
  if (!products.length) {
    return <p className="text-secondary text-center py-4">No items available right now.</p>;
  }
  return (
    <div className="row row-cards">
      {products.map((p) => (
        <div className="col-6 col-md-4 col-lg-3 mb-3" key={p.id}>
          <ProductCard product={p} onSelect={onSelect} />
        </div>
      ))}
    </div>
  );
}
