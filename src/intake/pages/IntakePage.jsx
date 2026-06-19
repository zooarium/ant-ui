import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Button, Spinner, Alert, useNotification, IconArrowLeft, IconAlertTriangle } from '@aviary-ui/ui';
import { STOREFRONT } from '@/public/storefront/data';
import '../intake.css';
import { useMenu } from '../hooks/useMenu';
import { useCart } from '../hooks/useCart';
import { usePlaceOrder } from '../hooks/usePlaceOrder';
import { fetchTab, fetchProduct, createOrderGroup } from '../api/public';
import { getDeviceId } from '../lib/deviceId';
import { getActiveTab, setActiveTab, clearActiveTab, getCustomer, setCustomer } from '../session';
import ProductGrid from '../components/ProductGrid';
import OptionPicker from '../components/OptionPicker';
import CartDrawer from '../components/CartDrawer';
import DetailsForm from '../components/DetailsForm';
import OrderConfirmation from '../components/OrderConfirmation';
import TabView from '../components/TabView';
import HistoryList from '../components/HistoryList';
import ShareBar from '../components/ShareBar';

// Single-page intake flow. URL params drive the shareable surfaces:
//   ?tab=<token>     → land on a shared tab (validate + offer to add to it)
//   ?view=history    → returning-customer past visits
// Otherwise: Menu → Details → Confirmation stepper.
export default function IntakePage() {
  const [params, setParams] = useSearchParams();
  const tabToken = params.get('tab');
  const view = params.get('view');

  const { showNotification } = useNotification();
  const { products, isLoading, error: menuError } = useMenu();
  const cart = useCart();
  const { place, isSubmitting } = usePlaceOrder();

  const [step, setStep] = useState('menu'); // menu | details | confirm
  const [selected, setSelected] = useState(null); // product in the option picker
  const [loadingProduct, setLoadingProduct] = useState(false);
  const [placed, setPlaced] = useState(null); // order shown on confirmation
  const [activeTab, setActiveTabState] = useState(() => getActiveTab());
  const [formError, setFormError] = useState(null);
  const [creatingTab, setCreatingTab] = useState(false);

  // Ensure a device_id exists on landing (soft recognition signal).
  useEffect(() => {
    getDeviceId();
  }, []);

  // Browser tab title = tenant name (replaces the static "App" from index.html).
  useEffect(() => {
    if (STOREFRONT.name) document.title = STOREFRONT.name;
  }, []);

  // List payload omits attributes (ant loads them only on GetByID), so fetch the
  // full product before opening the picker — otherwise mandatory options can't be
  // chosen and the API rejects the order with "mandatory attribute is missing".
  const onSelectProduct = async (p) => {
    setLoadingProduct(true);
    try {
      const res = await fetchProduct(p.id);
      setSelected(res?.data ?? p);
    } catch {
      setSelected(p);
    } finally {
      setLoadingProduct(false);
    }
  };

  // Mint a shared tab up front so family can join and order before anyone places
  // the first order. Orders then auto-attach via activeTab.group_id.
  const startSharedTab = async () => {
    if (activeTab) return;
    setCreatingTab(true);
    try {
      const name = getCustomer()?.customer_name;
      const res = await createOrderGroup({ label: name ? `${name}'s order` : 'Shared order' });
      const data = res?.data;
      if (!data?.id || !data?.token) throw new Error('No tab returned.');
      const tab = { group_id: data.id, token: data.token };
      setActiveTab(tab);
      setActiveTabState(tab);
    } catch (e) {
      showNotification(e.message || 'Could not start a shared order.', 'error');
    } finally {
      setCreatingTab(false);
    }
  };

  const endSharedTab = () => {
    clearActiveTab();
    setActiveTabState(null);
  };

  const goHistory = () => setParams({ view: 'history' });
  const goOrder = () => setParams({});
  const openTab = (token) => setParams({ tab: token });

  // --- Shared-tab landing (?tab=) ---
  if (tabToken) {
    const joinThisTab = async () => {
      try {
        const res = await fetchTab(tabToken);
        const id = res?.data?.id;
        if (!id) return showNotification('Tab not found.', 'error');
        const tab = { group_id: id, token: tabToken };
        setActiveTab(tab);
        setActiveTabState(tab);
        setParams({});
        setStep('menu');
      } catch (e) {
        showNotification(e.message || 'Could not open tab.', 'error');
      }
    };

    return (
      <Shell onHistory={goHistory} onHome={goOrder}>
        <TabView token={tabToken} />
        <div className="d-flex flex-wrap gap-2 justify-content-center mt-3">
          <Button onClick={joinThisTab}>Add my order to this tab</Button>
          <Button variant="outline-secondary" onClick={goOrder}>
            Start a separate order
          </Button>
        </div>
      </Shell>
    );
  }

  // --- History (?view=history) ---
  if (view === 'history') {
    return (
      <Shell onHome={goOrder} title="Your past visits">
        <HistoryList onOpenTab={openTab} />
      </Shell>
    );
  }

  // --- Order flow ---
  const onSubmitDetails = async (values) => {
    setFormError(null);
    try {
      let group_id = activeTab?.group_id;
      let group_label;
      if (!group_id && values.joinToken) {
        const res = await fetchTab(values.joinToken);
        group_id = res?.data?.id;
        if (!group_id) return setFormError('That tab token was not found.');
      }
      if (!group_id) group_label = `${values.customer_name}'s order`;

      const result = await place({
        products: cart.toOrderItems(),
        customer_name: values.customer_name,
        customer_contact: values.customer_contact,
        group_id,
        group_label,
      });

      // Remember for pre-filling the next order.
      setCustomer({ customer_name: values.customer_name, customer_contact: values.customer_contact });

      cart.clear();
      if (result.dropped) {
        // Honeypot tripped — treat as submitted, don't error.
        showNotification('Order submitted.', 'success');
        setStep('menu');
        return;
      }
      setPlaced(result.order);
      setStep('confirm');
    } catch (e) {
      if (e.status === 429) {
        setFormError("You've reached the order limit. Please try later or order at the counter.");
      } else if (e.status === 403) {
        setFormError('We could not verify your request. Please try again.');
      } else {
        setFormError(e.message || 'Something went wrong. Please try again.');
      }
    }
  };

  const addAnother = () => {
    setActiveTabState(getActiveTab());
    setPlaced(null);
    setStep('menu');
  };
  const startNew = () => {
    clearActiveTab();
    setActiveTabState(null);
    setPlaced(null);
    setStep('menu');
  };

  return (
    <Shell onHistory={goHistory}>
      {step !== 'confirm' && (
        <ShareBar
          token={activeTab?.token}
          onCreate={startSharedTab}
          onEnd={endSharedTab}
          isCreating={creatingTab}
        />
      )}

      {step === 'confirm' && placed && (
        <OrderConfirmation
          order={placed}
          onAddAnother={addAnother}
          onStartNew={startNew}
          onViewTab={() => openTab(placed.group_token)}
        />
      )}

      {step === 'menu' && (
        <div className="row">
          <div className="col-lg-8">
            {isLoading ? (
              <Spinner centered />
            ) : menuError ? (
              <Alert type="error" icon={IconAlertTriangle}>{menuError}</Alert>
            ) : (
              <ProductGrid products={products} onSelect={onSelectProduct} />
            )}
          </div>
          <div className="col-lg-4">
            <CartDrawer cart={cart} onContinue={() => cart.items.length && setStep('details')} />
          </div>
        </div>
      )}

      {step === 'details' && (
        <div className="row justify-content-center">
          <div className="col-md-6">
            <Button variant="ghost-secondary" size="sm" className="mb-2" onClick={() => setStep('menu')}>
              <IconArrowLeft size={16} className="me-1" /> Back to menu
            </Button>
            {formError && (
              <Alert type="error" icon={IconAlertTriangle} className="mb-3">{formError}</Alert>
            )}
            <DetailsForm
              activeTabLabel={activeTab ? 'shared order' : undefined}
              defaultName={getCustomer()?.customer_name ?? ''}
              defaultContact={getCustomer()?.customer_contact ?? ''}
              onSubmit={onSubmitDetails}
              isSubmitting={isSubmitting}
            />
          </div>
        </div>
      )}

      <OptionPicker product={selected} onAdd={cart.add} onClose={() => setSelected(null)} />
    </Shell>
  );
}

// hex "#rrggbb" → "r, g, b" for tabler's --tblr-primary-rgb (used in rgba()).
function hexToRgb(hex) {
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.replace(/(.)/g, '$1$1') : h, 16);
  return `${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}`;
}

// Page chrome shared across the intake surfaces. Themed from the tenant's
// storefront branding (same data source) so intake matches the landing page:
// the primary colour drives tabler's --tblr-primary (buttons/links) and the
// storefront font/brand bar carry over.
function Shell({ children, onHistory, onHome, title = 'Place your order' }) {
  const brand = STOREFRONT.name;
  const primary = STOREFRONT.branding?.primaryColor || '#b8482e';
  const themeVars = {
    '--sf-primary': primary,
    '--tblr-primary': primary,
    '--tblr-primary-rgb': hexToRgb(primary),
  };

  return (
    <div className="page sf-intake" style={themeVars}>
      <header className="sf-intake__bar">
        <div className="container d-flex align-items-center justify-content-between py-2">
          <Link to="/" className="sf-intake__brand">{brand}</Link>
          {onHistory && (
            <Button variant="ghost-secondary" size="sm" onClick={onHistory}>
              Past visits
            </Button>
          )}
        </div>
      </header>
      <div className="container py-4">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h1 className="h2 mb-0" role={onHome ? 'button' : undefined} onClick={onHome}>
            {title}
          </h1>
        </div>
        {children}
      </div>
    </div>
  );
}
