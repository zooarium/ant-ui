import React from 'react';

// About Us — heading, narrative, highlight chips.
export default function About({ about }) {
  if (!about) return null;
  return (
    <section id="about" className="sf-section">
      <div className="container">
        <p className="sf-eyebrow">About us</p>
        <h2 className="sf-section__title">{about.heading}</h2>
        <p className="sf-lead">{about.body}</p>

        <div className="row g-3 mt-2">
          {about.highlights?.map((h) => (
            <div key={h.label} className="col-6 col-lg-3">
              <div className="sf-highlight">
                <div className="sf-highlight__label">{h.label}</div>
                <div className="sf-highlight__detail">{h.detail}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
