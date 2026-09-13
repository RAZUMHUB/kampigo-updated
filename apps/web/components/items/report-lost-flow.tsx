'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import {
  ChevronLeft,
  LockKeyhole,
  PackageSearch,
} from 'lucide-react';
import { api } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { StepProgress } from './step-progress';

const CATEGORIES = [
  'Electronics',
  'Keys',
  'Wallet/ID',
  'Bags',
  'Documents',
  'Bottles',
  'Accessories',
  'Other',
];

interface FormState {
  categoryId: string;
  title: string;
  description: string;
  brand: string;
  model: string;
  primaryColor: string;
  secondaryColor: string;
  distinctiveMarks: string;
  campusId: string;
  buildingId: string;
  floorOrZone: string;
  nearbyLandmark: string;
  lostDate: string;
  lostTimeApprox: string;
  privateDetails: {
    exactKeyCount: string;
    hiddenSticker: string;
    scratchLocation: string;
    privateWriting: string;
    walletContents: string;
    uniqueMark: string;
  };
}

const INITIAL_STATE: FormState = {
  categoryId: '',
  title: '',
  description: '',
  brand: '',
  model: '',
  primaryColor: '',
  secondaryColor: '',
  distinctiveMarks: '',
  campusId: '',
  buildingId: '',
  floorOrZone: '',
  nearbyLandmark: '',
  lostDate: '',
  lostTimeApprox: '',
  privateDetails: {
    exactKeyCount: '',
    hiddenSticker: '',
    scratchLocation: '',
    privateWriting: '',
    walletContents: '',
    uniqueMark: '',
  },
};

const TOTAL_STEPS = 5;

export function ReportLostFlow() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormState>(INITIAL_STATE);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);

  const submitMutation = useMutation({
    mutationFn: async () => {
      const result = await api.post<{ item: { id: string }; quickMatches: any[] }>('/lost-items', {
        categoryId: form.categoryId || undefined,
        title: form.title,
        description: form.description,
        brand: form.brand || undefined,
        model: form.model || undefined,
        primaryColor: form.primaryColor || undefined,
        secondaryColor: form.secondaryColor || undefined,
        distinctiveMarks: form.distinctiveMarks || undefined,
        campusId: form.campusId || undefined,
        buildingId: form.buildingId || undefined,
        floorOrZone: form.floorOrZone || undefined,
        nearbyLandmark: form.nearbyLandmark || undefined,
        lostDate: form.lostDate,
        lostTimeApprox: form.lostTimeApprox || undefined,
        privateDetails: Object.fromEntries(
          Object.entries(form.privateDetails).filter(([, value]) => value),
        ),
      });

      if (selectedImage) {
        const formData = new FormData();
        formData.append('file', selectedImage);

        await api.upload(
          `/lost-items/${result.item.id}/images`,
          formData,
        );
      }

      return result;
    },
    onSuccess: (data) => {
      router.push(`/report/lost/success?itemId=${data.item.id}`);
    },
  });

  function update<K extends keyof FormState>(
    key: K,
    value: FormState[K],
  ) {
    setForm((previous) => ({
      ...previous,
      [key]: value,
    }));
  }

  function updatePrivate(
    key: keyof FormState['privateDetails'],
    value: string,
  ) {
    setForm((previous) => ({
      ...previous,
      privateDetails: {
        ...previous.privateDetails,
        [key]: value,
      },
    }));
  }

  const canGoNext =
    (step === 1 &&
      Boolean(form.title.trim()) &&
      Boolean(form.description.trim())) ||
    (step === 2 && Boolean(form.categoryId)) ||
    step === 3 ||
    step === 4 ||
    step === 5;

  function goBack() {
    if (step > 1) {
      setStep((current) => current - 1);
      return;
    }

    router.back();
  }

  return (
    <div className="px-4 py-6 sm:px-6 md:px-8 md:py-10">
      <div className="mx-auto w-full max-w-6xl">
        <div className="grid gap-8 lg:grid-cols-[0.65fr_1.35fr]">
          <aside className="lg:sticky lg:top-28 lg:self-start">
            <button
              onClick={goBack}
              aria-label="Go back"
              className="mb-6 flex items-center gap-2 rounded-xl px-2 py-2 text-sm font-medium text-ink-500 transition hover:bg-ink-50 hover:text-ink-800"
            >
              <ChevronLeft className="h-5 w-5" />
              Back
            </button>

            <div className="rounded-card border border-ink-100 bg-surface-raised p-5 shadow-sm md:p-6">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-ink-50 text-ink-700">
                <PackageSearch className="h-5 w-5" />
              </div>

              <p className="mt-6 text-sm font-medium text-ink-400">
                Lost item report
              </p>

              <h1 className="mt-2 font-display text-2xl font-bold tracking-tight text-ink-900 md:text-3xl">
                Help us identify your missing item.
              </h1>

              <p className="mt-3 text-sm leading-6 text-ink-400">
                Add clear details about the item, location and ownership.
                We will automatically compare your report with found items.
              </p>

              <div className="mt-6">
                <StepProgress step={step} totalSteps={TOTAL_STEPS} />
              </div>
            </div>
          </aside>

          <section className="overflow-hidden rounded-card border border-ink-100 bg-surface-raised shadow-sm">
            <div className="min-h-[420px] p-4 sm:min-h-[480px] sm:p-7 md:min-h-[520px] md:p-10">
              {step === 1 && (
                <Step
                  eyebrow="Item details"
                  title="What did you lose?"
                  subtitle="Give the item a short title and a clear description."
                >
                  <Field label="Title">
                    <input
                      className="input"
                      placeholder="e.g. Black key set with red keychain"
                      value={form.title}
                      onChange={(event) =>
                        update('title', event.target.value)
                      }
                    />
                  </Field>

                  <Field label="Description">
                    <textarea
                      className="input min-h-32 resize-y"
                      placeholder="Describe the item in your own words"
                      value={form.description}
                      onChange={(event) =>
                        update('description', event.target.value)
                      }
                    />
                  </Field>

                  <Field label="Item photo (optional)">
                    <input
                      type="file"
                      accept="image/*"
                      className="input"
                      onChange={(event) =>
                        setSelectedImage(event.target.files?.[0] ?? null)
                      }
                    />
                  </Field>
                </Step>
              )}

              {step === 2 && (
                <Step
                  eyebrow="Appearance"
                  title="Category and details"
                  subtitle="These details improve automatic matching accuracy."
                >
                  <Field label="Category">
                    <select
                      className="input"
                      value={form.categoryId}
                      onChange={(event) =>
                        update('categoryId', event.target.value)
                      }
                    >
                      <option value="">Select a category</option>
                      {CATEGORIES.map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                  </Field>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Brand">
                      <input
                        className="input"
                        value={form.brand}
                        onChange={(event) =>
                          update('brand', event.target.value)
                        }
                      />
                    </Field>

                    <Field label="Model">
                      <input
                        className="input"
                        value={form.model}
                        onChange={(event) =>
                          update('model', event.target.value)
                        }
                      />
                    </Field>

                    <Field label="Primary color">
                      <input
                        className="input"
                        value={form.primaryColor}
                        onChange={(event) =>
                          update('primaryColor', event.target.value)
                        }
                      />
                    </Field>

                    <Field label="Secondary color">
                      <input
                        className="input"
                        value={form.secondaryColor}
                        onChange={(event) =>
                          update('secondaryColor', event.target.value)
                        }
                      />
                    </Field>
                  </div>

                  <Field label="Distinctive marks (optional, publicly visible)">
                    <textarea
                      className="input min-h-24 resize-y"
                      placeholder="e.g. Small dent on the corner"
                      value={form.distinctiveMarks}
                      onChange={(event) =>
                        update('distinctiveMarks', event.target.value)
                      }
                    />
                  </Field>
                </Step>
              )}

              {step === 3 && (
                <Step
                  eyebrow="Last seen"
                  title="Where and when?"
                  subtitle="Approximate information is fine."
                >
                  <Field label="Building / area">
                    <input
                      className="input"
                      placeholder="e.g. Engineering Block A"
                      value={form.floorOrZone}
                      onChange={(event) =>
                        update('floorOrZone', event.target.value)
                      }
                    />
                  </Field>

                  <Field label="Nearby landmark">
                    <input
                      className="input"
                      placeholder="e.g. Library entrance"
                      value={form.nearbyLandmark}
                      onChange={(event) =>
                        update('nearbyLandmark', event.target.value)
                      }
                    />
                  </Field>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Date lost">
                      <input
                        type="date"
                        className="input"
                        value={form.lostDate}
                        onChange={(event) =>
                          update('lostDate', event.target.value)
                        }
                      />
                    </Field>

                    <Field label="Approx. time">
                      <input
                        type="time"
                        className="input"
                        value={form.lostTimeApprox}
                        onChange={(event) =>
                          update('lostTimeApprox', event.target.value)
                        }
                      />
                    </Field>
                  </div>
                </Step>
              )}

              {step === 4 && (
                <Step
                  eyebrow="Ownership verification"
                  title="Private ownership details"
                  subtitle="These details are never shown publicly. They are used only for owner verification."
                >
                  <div className="flex items-start gap-3 rounded-xl border border-amber-400/40 bg-amber-400/10 p-4">
                    <LockKeyhole className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600" />
                    <p className="text-sm leading-6 text-ink-600">
                      Add details only the real owner is likely to know.
                    </p>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Exact number of keys">
                      <input
                        className="input"
                        value={form.privateDetails.exactKeyCount}
                        onChange={(event) =>
                          updatePrivate(
                            'exactKeyCount',
                            event.target.value,
                          )
                        }
                      />
                    </Field>

                    <Field label="Hidden sticker / mark">
                      <input
                        className="input"
                        value={form.privateDetails.hiddenSticker}
                        onChange={(event) =>
                          updatePrivate(
                            'hiddenSticker',
                            event.target.value,
                          )
                        }
                      />
                    </Field>

                    <Field label="Scratch location">
                      <input
                        className="input"
                        value={form.privateDetails.scratchLocation}
                        onChange={(event) =>
                          updatePrivate(
                            'scratchLocation',
                            event.target.value,
                          )
                        }
                      />
                    </Field>

                    <Field label="Wallet contents">
                      <input
                        className="input"
                        value={form.privateDetails.walletContents}
                        onChange={(event) =>
                          updatePrivate(
                            'walletContents',
                            event.target.value,
                          )
                        }
                      />
                    </Field>
                  </div>
                </Step>
              )}

              {step === 5 && (
                <Step
                  eyebrow="Final review"
                  title="Review and publish"
                  subtitle="Once published, we will immediately check for possible matches."
                >
                  <div className="overflow-hidden rounded-xl border border-ink-100">
                    <SummaryRow label="Title" value={form.title} />
                    <SummaryRow
                      label="Category"
                      value={form.categoryId || 'Not provided'}
                    />
                    <SummaryRow
                      label="Location"
                      value={
                        form.nearbyLandmark ||
                        form.floorOrZone ||
                        'Not provided'
                      }
                    />
                    <SummaryRow
                      label="Date lost"
                      value={form.lostDate || 'Not provided'}
                    />
                  </div>

                  {submitMutation.isError && (
                    <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
                      Something went wrong publishing your report. Please try
                      again.
                    </p>
                  )}
                </Step>
              )}
            </div>

            <div className="border-t border-ink-100 bg-surface px-5 py-4 sm:px-7 md:px-10">
              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                {step > 1 && (
                  <Button
                    variant="secondary"
                    className="sm:min-w-28"
                    onClick={() =>
                      setStep((current) => current - 1)
                    }
                  >
                    Back
                  </Button>
                )}

                {step < TOTAL_STEPS ? (
                  <Button
                    className="sm:min-w-36"
                    disabled={!canGoNext}
                    onClick={() =>
                      setStep((current) => current + 1)
                    }
                  >
                    Continue
                  </Button>
                ) : (
                  <Button
                    className="sm:min-w-40"
                    disabled={submitMutation.isPending}
                    onClick={() => submitMutation.mutate()}
                  >
                    {submitMutation.isPending
                      ? 'Publishing...'
                      : 'Publish Report'}
                  </Button>
                )}
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function Step({
  eyebrow,
  title,
  subtitle,
  children,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-5">
      <div className="mb-2">
        <p className="text-sm font-medium text-ink-400">{eyebrow}</p>
        <h2 className="mt-2 font-display text-2xl font-bold tracking-tight text-ink-900 md:text-3xl">
          {title}
        </h2>
        {subtitle && (
          <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-400">
            {subtitle}
          </p>
        )}
      </div>

      {children}
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-2 text-sm font-medium text-ink-700">
      {label}
      {children}
    </label>
  );
}

function SummaryRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex flex-col gap-1 border-b border-ink-100 px-4 py-3 last:border-b-0 sm:flex-row sm:items-center sm:justify-between">
      <span className="text-sm text-ink-400">{label}</span>
      <span className="break-words text-sm font-medium text-ink-800 sm:max-w-[60%] sm:text-right">
        {value}
      </span>
    </div>
  );
}
