'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import {
  Building2,
  ChevronLeft,
  PackagePlus,
  ShieldCheck,
  UserRound,
} from 'lucide-react';
import { api } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { StepProgress } from './step-progress';
import { clsx } from 'clsx';

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

const CUSTODY_OPTIONS = [
  {
    value: 'WITH_FINDER',
    label: 'Still with me',
    description: 'You are currently keeping the item safe.',
    icon: UserRound,
  },
  {
    value: 'SUBMITTED_TO_SECURITY',
    label: 'Submitted to campus security',
    description: 'The item was handed to campus security.',
    icon: ShieldCheck,
  },
  {
    value: 'SUBMITTED_TO_OFFICE',
    label: 'Submitted to an office',
    description: 'The item is with a university office.',
    icon: Building2,
  },
  {
    value: 'SECURED_BY_AUTHORITY',
    label: 'Secured by a campus authority',
    description: 'A campus authority is holding the item.',
    icon: ShieldCheck,
  },
];

interface FormState {
  categoryId: string;
  title: string;
  description: string;
  brand: string;
  primaryColor: string;
  nearbyLandmark: string;
  foundDate: string;
  foundTimeApprox: string;
  custodyStatus: string;
  authorityOffice: string;
  recoveryRefNumber: string;
}

const INITIAL_STATE: FormState = {
  categoryId: '',
  title: '',
  description: '',
  brand: '',
  primaryColor: '',
  nearbyLandmark: '',
  foundDate: '',
  foundTimeApprox: '',
  custodyStatus: 'WITH_FINDER',
  authorityOffice: '',
  recoveryRefNumber: '',
};

const TOTAL_STEPS = 4;

export function ReportFoundFlow() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormState>(INITIAL_STATE);

  const submitMutation = useMutation({
    mutationFn: () =>
      api.post<{ id: string }>('/found-items', {
        categoryId: form.categoryId || undefined,
        title: form.title,
        description: form.description,
        brand: form.brand || undefined,
        primaryColor: form.primaryColor || undefined,
        nearbyLandmark: form.nearbyLandmark || undefined,
        foundDate: form.foundDate,
        foundTimeApprox: form.foundTimeApprox || undefined,
        custodyStatus: form.custodyStatus,
        authorityOffice: form.authorityOffice || undefined,
        recoveryRefNumber: form.recoveryRefNumber || undefined,
      }),
    onSuccess: () => router.push('/report/found/success'),
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

  function goBack() {
    if (step > 1) {
      setStep((current) => current - 1);
      return;
    }

    router.back();
  }

  const canGoNext =
    (step === 1 &&
      Boolean(form.title.trim()) &&
      Boolean(form.description.trim()) &&
      Boolean(form.categoryId)) ||
    step === 2 ||
    step === 3 ||
    step === 4;

  const custodyLabel =
    CUSTODY_OPTIONS.find(
      (option) => option.value === form.custodyStatus,
    )?.label ?? form.custodyStatus;

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
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-400/15 text-amber-600">
                <PackagePlus className="h-5 w-5" />
              </div>

              <p className="mt-6 text-sm font-medium text-amber-600">
                Found item report
              </p>

              <h1 className="mt-2 font-display text-2xl font-bold tracking-tight text-ink-900 md:text-3xl">
                Help this item get back to its owner.
              </h1>

              <p className="mt-3 text-sm leading-6 text-ink-400">
                Share where you found the item and where it is being kept.
                We will compare it with active lost reports.
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
                  title="What did you find?"
                  subtitle="Add enough public information for automatic matching."
                >
                  <Field label="Title">
                    <input
                      className="input"
                      placeholder="e.g. Black wireless headphones"
                      value={form.title}
                      onChange={(event) =>
                        update('title', event.target.value)
                      }
                    />
                  </Field>

                  <Field label="Description">
                    <textarea
                      className="input min-h-32 resize-y"
                      placeholder="Describe the item"
                      value={form.description}
                      onChange={(event) =>
                        update('description', event.target.value)
                      }
                    />
                  </Field>

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

                    <Field label="Primary color">
                      <input
                        className="input"
                        value={form.primaryColor}
                        onChange={(event) =>
                          update('primaryColor', event.target.value)
                        }
                      />
                    </Field>
                  </div>
                </Step>
              )}

              {step === 2 && (
                <Step
                  eyebrow="Found location"
                  title="Where and when did you find it?"
                  subtitle="Approximate details are enough."
                >
                  <Field label="Nearby landmark">
                    <input
                      className="input"
                      placeholder="e.g. Main library entrance"
                      value={form.nearbyLandmark}
                      onChange={(event) =>
                        update('nearbyLandmark', event.target.value)
                      }
                    />
                  </Field>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Date found">
                      <input
                        type="date"
                        className="input"
                        value={form.foundDate}
                        onChange={(event) =>
                          update('foundDate', event.target.value)
                        }
                      />
                    </Field>

                    <Field label="Approx. time">
                      <input
                        type="time"
                        className="input"
                        value={form.foundTimeApprox}
                        onChange={(event) =>
                          update('foundTimeApprox', event.target.value)
                        }
                      />
                    </Field>
                  </div>
                </Step>
              )}

              {step === 3 && (
                <Step
                  eyebrow="Item custody"
                  title="Where is the item now?"
                  subtitle="This helps the verified owner understand the recovery process."
                >
                  <div className="grid gap-3">
                    {CUSTODY_OPTIONS.map((option) => {
                      const Icon = option.icon;
                      const selected =
                        form.custodyStatus === option.value;

                      return (
                        <label
                          key={option.value}
                          className={clsx(
                            'flex cursor-pointer items-start gap-4 rounded-xl border p-4 transition',
                            selected
                              ? 'border-ink-700 bg-ink-50'
                              : 'border-ink-100 hover:border-ink-200',
                          )}
                        >
                          <input
                            type="radio"
                            name="custody"
                            className="sr-only"
                            checked={selected}
                            onChange={() =>
                              update(
                                'custodyStatus',
                                option.value,
                              )
                            }
                          />

                          <div
                            className={clsx(
                              'flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl',
                              selected
                                ? 'bg-ink-700 text-surface'
                                : 'bg-ink-50 text-ink-500',
                            )}
                          >
                            <Icon className="h-5 w-5" />
                          </div>

                          <div>
                            <p className="font-semibold text-ink-800">
                              {option.label}
                            </p>
                            <p className="mt-1 text-xs leading-5 text-ink-400">
                              {option.description}
                            </p>
                          </div>
                        </label>
                      );
                    })}
                  </div>

                  {form.custodyStatus !== 'WITH_FINDER' && (
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field label="Office / authority name">
                        <input
                          className="input"
                          value={form.authorityOffice}
                          onChange={(event) =>
                            update(
                              'authorityOffice',
                              event.target.value,
                            )
                          }
                        />
                      </Field>

                      <Field label="Recovery reference number">
                        <input
                          className="input"
                          value={form.recoveryRefNumber}
                          onChange={(event) =>
                            update(
                              'recoveryRefNumber',
                              event.target.value,
                            )
                          }
                        />
                      </Field>
                    </div>
                  )}
                </Step>
              )}

              {step === 4 && (
                <Step
                  eyebrow="Final review"
                  title="Review and publish"
                  subtitle="We will automatically check this report against active lost items."
                >
                  <div className="overflow-hidden rounded-xl border border-ink-100">
                    <SummaryRow label="Title" value={form.title} />
                    <SummaryRow
                      label="Category"
                      value={form.categoryId || 'Not provided'}
                    />
                    <SummaryRow
                      label="Found near"
                      value={form.nearbyLandmark || 'Not provided'}
                    />
                    <SummaryRow
                      label="Date found"
                      value={form.foundDate || 'Not provided'}
                    />
                    <SummaryRow
                      label="Item custody"
                      value={custodyLabel}
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
