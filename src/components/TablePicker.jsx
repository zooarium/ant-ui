import React, { useState } from 'react';
import { Button } from '@aviary-ui/ui';

const TABLES = Array.from({ length: 50 }, (_, i) => i + 1);

// Toggle button that reveals/hides the table grid. Controlled when `open`/
// `onToggle` are passed (lets a parent place the button and the grid in
// different layout slots — e.g. button beside the label field, grid in a
// full-width row); otherwise it manages nothing on its own.
export function TablePickerButton({ open, onToggle, className = '' }) {
  return (
    <Button
      variant="outline-secondary"
      size="sm"
      type="button"
      className={className}
      onClick={onToggle}
    >
      {open ? 'Hide tables' : 'Pick table'}
    </Button>
  );
}

// Bare 1..50 grid as a full-width block (10 columns) filling its container.
// Host it where it has room (a full-width row) so it lays out as a wide matrix
// rather than a tall single column. onSelect(n) fires on a number click.
export function TableNumberGrid({ onSelect, className = '' }) {
  return (
    <div
      className={className}
      style={{ display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', gap: '0.25rem' }}
    >
      {TABLES.map((n) => (
        <Button
          key={n}
          variant="outline-primary"
          size="sm"
          type="button"
          className="px-0"
          onClick={() => onSelect(n)}
        >
          {n}
        </Button>
      ))}
    </div>
  );
}

// Self-contained picker (button + grid stacked inline). Suitable where the host
// is already full width (e.g. a single-column modal field). Collapsed by
// default; selecting a number calls onSelect(n) and re-collapses.
export default function TablePicker({ onSelect, className = '' }) {
  const [open, setOpen] = useState(false);

  return (
    <div className={className}>
      <TablePickerButton open={open} onToggle={() => setOpen((o) => !o)} />
      {open && (
        <TableNumberGrid
          className="mt-2"
          onSelect={(n) => {
            onSelect(n);
            setOpen(false);
          }}
        />
      )}
    </div>
  );
}
