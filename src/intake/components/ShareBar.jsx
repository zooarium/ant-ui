import React from 'react';
import { Card, CardBody, Button, useNotification } from '@aviary-ui/ui';

// Top-of-page sharing surface. Lets a customer mint a shared tab BEFORE ordering
// so family members can join and add their own orders from the start. Once a tab
// exists it surfaces copy-link + WhatsApp share, plus an "end sharing" escape.
export default function ShareBar({ token, onCreate, onEnd, isCreating }) {
  const { showNotification } = useNotification();
  const shareUrl = token ? `${window.location.origin}/intake?tab=${token}` : '';

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      showNotification('Tab link copied.', 'success');
    } catch {
      showNotification('Could not copy — link: ' + shareUrl, 'info');
    }
  };

  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`Join our order tab: ${shareUrl}`)}`;

  if (!token) {
    return (
      <Card className="mb-3">
        <CardBody className="d-flex flex-wrap align-items-center justify-content-between gap-2">
          <span className="text-secondary">Ordering with family? Start a shared tab and invite them.</span>
          <Button onClick={onCreate} loading={isCreating}>
            Start a shared tab
          </Button>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card className="mb-3">
      <CardBody className="d-flex flex-wrap align-items-center justify-content-between gap-2">
        <span className="me-2 text-success fw-bold">Shared tab active — invite family to add their orders.</span>
        <div className="d-flex flex-wrap gap-2">
          <Button size="sm" onClick={copy}>
            Copy link
          </Button>
          <Button size="sm" variant="secondary" as="a" href={whatsappUrl} target="_blank" rel="noreferrer">
            WhatsApp
          </Button>
          <Button size="sm" variant="ghost-secondary" onClick={onEnd}>
            End sharing
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}
