import React from 'react';
import {
  IconMapPin, IconPhone, IconMail, IconClock,
  IconBrandInstagram, IconBrandFacebook, IconBrandWhatsapp,
  IconBrandX, IconBrandTiktok, IconWorld,
} from '@tabler/icons-react';

const SOCIAL_ICON = {
  instagram: IconBrandInstagram,
  facebook: IconBrandFacebook,
  whatsapp: IconBrandWhatsapp,
  x: IconBrandX,
  twitter: IconBrandX,
  tiktok: IconBrandTiktok,
};

// Contact — address/phone/email, working hours table, social links.
export default function Contact({ contact }) {
  if (!contact) return null;
  const { address, phone, email, hours = '', social = [] } = contact;

  return (
    <section id="contact" className="sf-section">
      <div className="container">
        <p className="sf-eyebrow">Visit us</p>
        <h2 className="sf-section__title">Find us &amp; get in touch</h2>

        <div className="row g-4">
          <div className="col-12 col-lg-6">
            <ul className="sf-contact-list">
              {address && (
                <li><IconMapPin size={20} /> <span>{address}</span></li>
              )}
              {phone && (
                <li><IconPhone size={20} /> <a href={`tel:${phone}`}>{phone}</a></li>
              )}
              {email && (
                <li><IconMail size={20} /> <a href={`mailto:${email}`}>{email}</a></li>
              )}
            </ul>

            {social.length > 0 && (
              <div className="sf-social">
                {social.map((s) => {
                  const Icon = SOCIAL_ICON[s.platform] || IconWorld;
                  return (
                    <a key={s.platform} href={s.url} target="_blank" rel="noreferrer"
                       aria-label={s.platform} className="sf-social__link">
                      <Icon size={22} />
                    </a>
                  );
                })}
              </div>
            )}
          </div>

          <div className="col-12 col-lg-6">
            <div className="sf-hours">
              <div className="sf-hours__head">
                <IconClock size={20} /> <span>Opening hours</span>
              </div>
              {/* hours is free-text from keeper PublicApp.contact.hours —
                  rendered verbatim, line breaks preserved. */}
              {hours ? (
                <div style={{ whiteSpace: 'pre-line' }}>{hours}</div>
              ) : (
                <div className="text-secondary">Hours coming soon.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
