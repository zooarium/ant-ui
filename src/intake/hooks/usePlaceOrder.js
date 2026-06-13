import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createOrder } from '../api/public';
import { getDeviceId } from '../lib/deviceId';
import { setActiveTab } from '../session';
import { TAB_KEY } from './useTab';
import { HISTORY_KEY } from './useHistory';

// Places the order. device_id and honeypot are attached here. Returns:
//   { dropped: true }            — honeypot tripped (data:null); treat as submitted.
//   { order }                    — created; active tab persisted for "Add another".
// Throws IntakeError on 400/403/429/etc. so the form can map status → message.
export function usePlaceOrder() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: ({ products, customer_name, customer_contact, group_id, group_label }) =>
      createOrder({
        customer_name,
        customer_contact,
        device_id: getDeviceId(),
        ...(group_id ? { group_id } : { group_label }),
        products,
      }),
    onSuccess: (res) => {
      const order = res?.data;
      if (!order) return; // honeypot drop
      setActiveTab({ group_id: order.group_id, token: order.group_token });
      queryClient.invalidateQueries({ queryKey: [TAB_KEY, order.group_token] });
      queryClient.invalidateQueries({ queryKey: [HISTORY_KEY] });
    },
  });

  const place = async (args) => {
    const res = await mutation.mutateAsync(args);
    return res?.data ? { order: res.data } : { dropped: true };
  };

  return { place, isSubmitting: mutation.isPending };
}
