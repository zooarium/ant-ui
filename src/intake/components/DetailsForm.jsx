import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button, FormField, Input } from '@aviary-ui/ui';
import Honeypot from './Honeypot';

const schema = z.object({
  customer_name: z.string().trim().min(1, 'Name is required').max(100),
  customer_contact: z
    .string()
    .trim()
    .min(7, 'Too short')
    .max(20, 'Too long')
    .regex(/^[+\d][\d\s-]*$/, 'Enter a valid phone number'),
  joinToken: z.string().trim().optional(),
  website: z.string().max(0).optional(), // honeypot — must stay empty
});

// Collects the customer's name + contact and an optional tab token to join.
// activeTabLabel, when set, shows that orders attach to an existing tab.
export default function DetailsForm({
  defaultJoinToken = '',
  defaultName = '',
  defaultContact = '',
  activeTabLabel,
  onSubmit,
  isSubmitting,
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      customer_name: defaultName,
      customer_contact: defaultContact,
      joinToken: defaultJoinToken,
      website: '',
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <FormField label="Your name" htmlFor="customer_name" error={errors.customer_name?.message}>
        <Input id="customer_name" error={errors.customer_name} {...register('customer_name')} maxLength={100} />
      </FormField>

      <FormField label="Contact number" htmlFor="customer_contact" error={errors.customer_contact?.message}>
        <Input
          id="customer_contact"
          type="tel"
          placeholder="+31 6 12345678"
          error={errors.customer_contact}
          {...register('customer_contact')}
        />
      </FormField>

      {activeTabLabel ? (
        <p className="text-secondary">Adding to tab: <strong>{activeTabLabel}</strong></p>
      ) : (
        <FormField
          label="Joining a tab? Paste its token (optional)"
          htmlFor="joinToken"
          error={errors.joinToken?.message}
        >
          <Input id="joinToken" placeholder="Tab token" {...register('joinToken')} />
        </FormField>
      )}

      <Honeypot register={register} />

      <Button type="submit" className="w-100" loading={isSubmitting}>
        Place order
      </Button>
    </form>
  );
}
