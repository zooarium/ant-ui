import React from 'react';
import { Select } from '@aviary-ui/ui';

// Poll intervals offered to the user, in seconds (0 = off).
const AUTO_REFRESH_OPTIONS = [3, 5, 10, 20, 30, 60];

// Auto-refresh dropdown. `value` is seconds (0 = off); `onChange` receives seconds.
// Callers convert seconds → ms for react-query's refetchInterval (0 ⇒ false/off):
//   const refetchInterval = seconds > 0 ? seconds * 1000 : false;
export default function AutoRefreshSelect({ value, onChange, className = '' }) {
  return (
    <Select
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className={className}
      aria-label="Auto refresh interval"
    >
      <option value={0}>Auto refresh: Off</option>
      {AUTO_REFRESH_OPTIONS.map((s) => (
        <option key={s} value={s}>
          Every {s}s
        </option>
      ))}
    </Select>
  );
}
