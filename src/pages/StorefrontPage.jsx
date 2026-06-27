import React, { useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Button,
  Card,
  CardBody,
  Spinner,
  FormField,
  Input,
  IconPlus,
  IconTrash,
  useNotification,
} from '@aviary-ui/ui';
import AdminLayout from '@/components/AdminLayout';
import { useStorefront } from '@/hooks/useStorefront';

// Storefront is a singleton per app, so this is one big form (no list/modal).
// status is always active — sent as 1 in the payload, never shown in the UI.
// gallery is URL-only (sort is auto-assigned from row order); food_tags are
// label-only; assessments carry a name, rating and editable review cards.
const urlField = z
  .string()
  .trim()
  .url('Must be a valid URL');

const schema = z.object({
  hero_image: z.union([urlField, z.literal('')]),
  gallery: z.array(z.object({ url: urlField })),
  food_tags: z.array(
    z.object({ label: z.string().trim().min(1, 'Label is required').max(100, 'Max 100 characters') })
  ),
  assessments: z.array(
    z.object({
      name: z.string().trim().min(1, 'Name is required').max(100, 'Max 100 characters'),
      rating: z.coerce.number().min(0, 'Min 0').max(5, 'Max 5'),
      reviews: z.array(
        z.object({
          author: z.string().trim().min(1, 'Author is required').max(100, 'Max 100 characters'),
          text: z.string().trim().min(1, 'Review text is required'),
        })
      ),
    })
  ),
});

const emptyValues = { hero_image: '', gallery: [], food_tags: [], assessments: [] };

// Slugs are derived from the label on save (no separate input): lowercased,
// non-alphanumerics collapsed to single dashes, trimmed.
const slugify = (label) =>
  label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

// Reviews are a field array nested inside each assessment — extracted so its own
// useFieldArray is scoped to assessments.<index>.reviews.
function AssessmentReviews({ control, register, nestIndex, errors }) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: `assessments.${nestIndex}.reviews`,
  });

  return (
    <div className="mt-3">
      <div className="d-flex align-items-center justify-content-between mb-2">
        <label className="form-label mb-0 text-secondary small">Reviews</label>
        <Button
          variant="outline-secondary"
          size="sm"
          type="button"
          onClick={() => append({ author: '', text: '' })}
          className="d-flex align-items-center gap-1"
        >
          <IconPlus size={14} />
          Add review
        </Button>
      </div>

      {fields.length === 0 && <div className="text-secondary small mb-2">No reviews.</div>}

      {fields.map((field, rIdx) => (
        <div key={field.id} className="d-flex gap-2 mb-2 align-items-start">
          <div style={{ width: '30%' }}>
            <Input
              type="text"
              placeholder="Author"
              error={errors?.[rIdx]?.author?.message}
              {...register(`assessments.${nestIndex}.reviews.${rIdx}.author`)}
            />
            {errors?.[rIdx]?.author && (
              <div className="invalid-feedback d-block">{errors[rIdx].author.message}</div>
            )}
          </div>
          <div className="flex-fill">
            <Input
              type="text"
              placeholder="Review text"
              error={errors?.[rIdx]?.text?.message}
              {...register(`assessments.${nestIndex}.reviews.${rIdx}.text`)}
            />
            {errors?.[rIdx]?.text && (
              <div className="invalid-feedback d-block">{errors[rIdx].text.message}</div>
            )}
          </div>
          <Button
            variant="ghost-danger"
            icon
            type="button"
            onClick={() => remove(rIdx)}
            title="Remove review"
          >
            <IconTrash size={16} />
          </Button>
        </div>
      ))}
    </div>
  );
}

export default function StorefrontPage() {
  const { showNotification } = useNotification();
  const { storefront, isLoading, error, refetch, save, isSaving } = useStorefront();

  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm({ resolver: zodResolver(schema), defaultValues: emptyValues });

  const gallery = useFieldArray({ control, name: 'gallery' });
  const foodTags = useFieldArray({ control, name: 'food_tags' });
  const assessments = useFieldArray({ control, name: 'assessments' });

  // Seed the form once the storefront loads (or stays empty for a brand-new one).
  useEffect(() => {
    if (!storefront) return;
    reset({
      hero_image: storefront.hero_image ?? '',
      gallery: (storefront.gallery ?? [])
        .slice()
        .sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0))
        .map((g) => ({ url: g.url ?? '' })),
      food_tags: (storefront.food_tags ?? []).map((t) => ({ label: t.label ?? '' })),
      assessments: (storefront.assessments ?? []).map((a) => ({
        name: a.name ?? '',
        rating: a.rating ?? 0,
        reviews: (a.reviews ?? []).map((r) => ({ author: r.author ?? '', text: r.text ?? '' })),
      })),
    });
  }, [storefront, reset]);

  const heroPreview = watch('hero_image');

  const submit = async (values) => {
    const payload = {
      status: 1, // always active
      hero_image: values.hero_image.trim(),
      // sort auto-assigned from row order.
      gallery: values.gallery.map((g, i) => ({ url: g.url.trim(), sort: i })),
      food_tags: values.food_tags.map((t) => ({ label: t.label.trim(), slug: slugify(t.label) })),
      assessments: values.assessments.map((a) => ({
        name: a.name.trim(),
        rating: a.rating,
        reviews: a.reviews.map((r) => ({ author: r.author.trim(), text: r.text.trim() })),
      })),
    };
    try {
      await save(payload);
    } catch (err) {
      showNotification(err.message, 'error');
    }
  };

  return (
    <AdminLayout>
      <div className="page-header d-print-none mb-3">
        <div className="row align-items-center">
          <div className="col">
            <h2 className="page-title">Storefront</h2>
            <div className="text-secondary">Manage your public storefront branding and content.</div>
          </div>
        </div>
      </div>

      {isLoading ? (
        <Spinner centered />
      ) : error ? (
        <Card>
          <CardBody>
            <p className="text-danger mb-3">{error}</p>
            <Button variant="outline-danger" onClick={refetch}>
              Retry
            </Button>
          </CardBody>
        </Card>
      ) : (
        <form onSubmit={handleSubmit(submit)} noValidate>
          {/* Hero */}
          <Card className="mb-3">
            <CardBody>
              <h3 className="card-title">Hero</h3>
              <FormField label="Hero image URL" htmlFor="heroImage" error={errors.hero_image?.message}>
                <Input
                  id="heroImage"
                  type="text"
                  placeholder="https://…"
                  error={errors.hero_image?.message}
                  {...register('hero_image')}
                />
              </FormField>
              {heroPreview ? (
                <img
                  src={heroPreview}
                  alt="Hero preview"
                  className="rounded border"
                  style={{ maxHeight: 160, objectFit: 'cover' }}
                />
              ) : null}
            </CardBody>
          </Card>

          {/* Gallery */}
          <Card className="mb-3">
            <CardBody>
              <div className="d-flex align-items-center justify-content-between mb-2">
                <h3 className="card-title mb-0">Gallery</h3>
                <Button
                  variant="outline-secondary"
                  size="sm"
                  type="button"
                  onClick={() => gallery.append({ url: '' })}
                  className="d-flex align-items-center gap-1"
                >
                  <IconPlus size={14} />
                  Add image
                </Button>
              </div>
              {gallery.fields.length === 0 && (
                <div className="text-secondary small mb-2">No images.</div>
              )}
              {gallery.fields.map((field, index) => (
                <div key={field.id} className="d-flex gap-2 mb-2">
                  <div className="flex-fill">
                    <Input
                      type="text"
                      placeholder="https://…"
                      error={errors.gallery?.[index]?.url?.message}
                      {...register(`gallery.${index}.url`)}
                    />
                    {errors.gallery?.[index]?.url && (
                      <div className="invalid-feedback d-block">
                        {errors.gallery[index].url.message}
                      </div>
                    )}
                  </div>
                  <Button
                    variant="ghost-danger"
                    icon
                    type="button"
                    onClick={() => gallery.remove(index)}
                    title="Remove image"
                  >
                    <IconTrash size={16} />
                  </Button>
                </div>
              ))}
            </CardBody>
          </Card>

          {/* Food tags */}
          <Card className="mb-3">
            <CardBody>
              <div className="d-flex align-items-center justify-content-between mb-2">
                <h3 className="card-title mb-0">Food tags</h3>
                <Button
                  variant="outline-secondary"
                  size="sm"
                  type="button"
                  onClick={() => foodTags.append({ label: '' })}
                  className="d-flex align-items-center gap-1"
                >
                  <IconPlus size={14} />
                  Add tag
                </Button>
              </div>
              {foodTags.fields.length === 0 && (
                <div className="text-secondary small mb-2">No tags.</div>
              )}
              {foodTags.fields.map((field, index) => (
                <div key={field.id} className="d-flex gap-2 mb-2">
                  <div className="flex-fill">
                    <Input
                      type="text"
                      placeholder="e.g. Vegan"
                      error={errors.food_tags?.[index]?.label?.message}
                      {...register(`food_tags.${index}.label`)}
                    />
                    {errors.food_tags?.[index]?.label && (
                      <div className="invalid-feedback d-block">
                        {errors.food_tags[index].label.message}
                      </div>
                    )}
                  </div>
                  <Button
                    variant="ghost-danger"
                    icon
                    type="button"
                    onClick={() => foodTags.remove(index)}
                    title="Remove tag"
                  >
                    <IconTrash size={16} />
                  </Button>
                </div>
              ))}
            </CardBody>
          </Card>

          {/* Assessments */}
          <Card className="mb-3">
            <CardBody>
              <div className="d-flex align-items-center justify-content-between mb-2">
                <h3 className="card-title mb-0">Assessments</h3>
                <Button
                  variant="outline-secondary"
                  size="sm"
                  type="button"
                  onClick={() => assessments.append({ name: '', rating: 0, reviews: [] })}
                  className="d-flex align-items-center gap-1"
                >
                  <IconPlus size={14} />
                  Add assessment
                </Button>
              </div>
              {assessments.fields.length === 0 && (
                <div className="text-secondary small mb-2">No assessments.</div>
              )}
              {assessments.fields.map((field, index) => (
                <div key={field.id} className="border rounded p-3 mb-3">
                  <div className="d-flex gap-2">
                    <div className="flex-fill">
                      <FormField
                        label="Name"
                        htmlFor={`assessment-${index}-name`}
                        error={errors.assessments?.[index]?.name?.message}
                      >
                        <Input
                          id={`assessment-${index}-name`}
                          type="text"
                          placeholder="e.g. Google"
                          error={errors.assessments?.[index]?.name?.message}
                          {...register(`assessments.${index}.name`)}
                        />
                      </FormField>
                    </div>
                    <div style={{ width: 120 }}>
                      <FormField
                        label="Rating"
                        htmlFor={`assessment-${index}-rating`}
                        error={errors.assessments?.[index]?.rating?.message}
                      >
                        <Input
                          id={`assessment-${index}-rating`}
                          type="number"
                          step="0.1"
                          min="0"
                          max="5"
                          error={errors.assessments?.[index]?.rating?.message}
                          {...register(`assessments.${index}.rating`)}
                        />
                      </FormField>
                    </div>
                    <div className="pt-4">
                      <Button
                        variant="ghost-danger"
                        icon
                        type="button"
                        onClick={() => assessments.remove(index)}
                        title="Remove assessment"
                      >
                        <IconTrash size={16} />
                      </Button>
                    </div>
                  </div>

                  <AssessmentReviews
                    control={control}
                    register={register}
                    nestIndex={index}
                    errors={errors.assessments?.[index]?.reviews}
                  />
                </div>
              ))}
            </CardBody>
          </Card>

          <div className="d-flex justify-content-end gap-2">
            <Button type="submit" loading={isSaving}>
              Save
            </Button>
          </div>
        </form>
      )}
    </AdminLayout>
  );
}
