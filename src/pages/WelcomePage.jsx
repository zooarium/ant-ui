import React from 'react';

// Public landing page (root domain). Customer-facing pages will grow from here.
export default function WelcomePage() {
  return (
    <div className="d-flex flex-column min-vh-100 justify-content-center align-items-center">
      <div className="container container-tight py-4 text-center">
        <h1 className="fw-bold fs-1 mb-2">Welcome to Ant world</h1>
        <p className="text-secondary">Your one-stop shop is coming soon.</p>
      </div>
    </div>
  );
}
