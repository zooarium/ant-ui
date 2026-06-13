import React from 'react';

// Anti-spam honeypot: a hidden "website" field no human ever fills. Bots that
// auto-fill forms trip it and the backend silently drops the order (200 + data:null).
// Kept off-screen rather than display:none (some bots skip display:none fields),
// and removed from tab order / a11y tree so real users never reach it.
export default function Honeypot({ register }) {
  return (
    <div
      aria-hidden="true"
      style={{ position: 'absolute', left: '-9999px', top: 'auto', width: 1, height: 1, overflow: 'hidden' }}
    >
      <label htmlFor="website">Website</label>
      <input id="website" type="text" tabIndex={-1} autoComplete="off" {...register('website')} />
    </div>
  );
}
