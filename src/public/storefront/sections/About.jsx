import React from 'react';

// About Us — heading + narrative. body is sanitized HTML (from keeper
// PublicApp.about.body) and may include highlight chips authored in the markup.
export default function About({ about }) {
  if (!about) return null;
  return (
    <section id="about" className="sf-section">
      <div className="container">
        <p className="sf-eyebrow">About us</p>
        {about.heading && <h2 className="sf-section__title">{about.heading}</h2>}
        <div
          className="sf-lead"
          dangerouslySetInnerHTML={{ __html: about.bodyHtml }}
        />
      </div>
    </section>
  );
}
