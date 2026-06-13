import React from 'react';
import { Input, IconX } from '@aviary-ui/ui';

// Text input with an inline clear (×) button overlaid on the right edge.
// Forwards ref and all other props to the underlying Input (so it works with
// react-hook-form's {...register()} spread). The × renders only when `onClear`
// is provided; clicking it calls onClear — the caller decides what "clear"
// means (empty the value, reset to a default, resume auto-fill, etc.).
const ClearableInput = React.forwardRef(function ClearableInput(
  { onClear, className = '', clearTitle = 'Clear', ...props },
  ref
) {
  return (
    <div className="position-relative">
      <Input ref={ref} className={`${onClear ? 'pe-5' : ''} ${className}`.trim()} {...props} />
      {onClear && (
        <button
          type="button"
          onClick={onClear}
          title={clearTitle}
          aria-label={clearTitle}
          className="btn btn-icon btn-ghost-secondary position-absolute top-50 end-0 translate-middle-y me-1 p-0 border-0"
          style={{ width: '1.5rem', height: '1.5rem' }}
        >
          <IconX size={14} />
        </button>
      )}
    </div>
  );
});

export default ClearableInput;
