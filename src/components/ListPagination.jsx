import React from 'react';
import { Button, IconChevronLeft, IconChevronRight } from '@aviary-ui/ui';

// Offset-based Prev/Next pager. The API returns no total count, so "Next" is
// enabled while the current page is full (count === limit).
export default function ListPagination({ offset, limit, count, onChange }) {
  const page = Math.floor(offset / limit) + 1;
  const hasPrev = offset > 0;
  const hasNext = count === limit;

  if (!hasPrev && !hasNext) return null;

  return (
    <div className="d-flex align-items-center justify-content-end gap-2 p-3">
      <span className="text-secondary small">Page {page}</span>
      <Button
        variant="outline-secondary"
        size="sm"
        icon
        disabled={!hasPrev}
        onClick={() => onChange(Math.max(0, offset - limit))}
        title="Previous page"
      >
        <IconChevronLeft size={16} />
      </Button>
      <Button
        variant="outline-secondary"
        size="sm"
        icon
        disabled={!hasNext}
        onClick={() => onChange(offset + limit)}
        title="Next page"
      >
        <IconChevronRight size={16} />
      </Button>
    </div>
  );
}
