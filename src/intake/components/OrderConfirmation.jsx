import React from 'react';
import { Card, CardBody, Button, useNotification, IconCheck } from '@aviary-ui/ui';
import { money } from '../lib/format';

// Success view after an order is placed. Surfaces the shareable tab token so
// family members can add to the same tab, plus add-another / new-tab actions.
export default function OrderConfirmation({ order, onAddAnother, onViewTab, onStartNew }) {
  const { showNotification } = useNotification();
  const token = order.group_token;
  const shareUrl = `${window.location.origin}/intake?tab=${token}`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      showNotification('Tab link copied.', 'success');
    } catch {
      showNotification('Could not copy — link: ' + shareUrl, 'info');
    }
  };

  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(
    `Join our order tab: ${shareUrl}`
  )}`;

  return (
    <Card>
      <CardBody className="text-center">
        <div className="text-success mb-2">
          <IconCheck size={48} />
        </div>
        <h2 className="mb-1">Order placed!</h2>
        <p className="text-secondary">
          Order #{order.id} · {money(order.total)} · pay at reception.
        </p>

        <div className="my-3 p-3 bg-secondary-lt rounded">
          <div className="text-secondary small mb-1">Share this tab so others can add their orders</div>
          <code className="d-block text-truncate">{token}</code>
        </div>

        <div className="d-flex flex-wrap gap-2 justify-content-center">
          <Button onClick={copy}>Copy tab link</Button>
          <Button variant="secondary" as="a" href={whatsappUrl} target="_blank" rel="noreferrer">
            Share on WhatsApp
          </Button>
        </div>

        <hr />
        <div className="d-flex flex-wrap gap-2 justify-content-center">
          <Button variant="outline-secondary" onClick={onViewTab}>
            View tab
          </Button>
          <Button variant="outline-secondary" onClick={onAddAnother}>
            Add another order
          </Button>
          <Button variant="ghost-secondary" onClick={onStartNew}>
            Start a new tab
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}
