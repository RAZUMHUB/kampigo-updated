'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { AuthGuard } from '@/components/auth/auth-guard';
import { createRental } from '@/lib/rentals-api';

export default function ListClothingPage() {
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [pricePerDay, setPricePerDay] = useState('');
  const [securityDeposit, setSecurityDeposit] = useState('');

  const createMutation = useMutation({
    mutationFn: () =>
      createRental({
        category: 'CLOTHES',
        title: title.trim(),
        description: description.trim(),
        pricePerDay: Number(pricePerDay),
        securityDeposit: securityDeposit ? Number(securityDeposit) : 0,
      }),
    onSuccess: () => {
      router.push('/clothes-rental/list-item/success');
    },
  });

  const priceValue = Number(pricePerDay);
  const isValid =
    title.trim().length > 0 &&
    description.trim().length > 0 &&
    Number.isFinite(priceValue) &&
    priceValue > 0;

  return (
    <AuthGuard>
      <main className="mx-auto max-w-4xl space-y-8 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <section>
          <h1 className="text-3xl font-bold sm:text-4xl">List Your Clothing</h1>

          <p className="mt-2 text-muted-foreground">
            Share your clothes with students and earn money.
          </p>
        </section>

        <Card className="space-y-6 p-4 sm:p-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-medium">Title</label>

              <Input
                placeholder="Black Formal Suit"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                maxLength={120}
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">
                Price Per Day (₹)
              </label>

              <Input
                type="number"
                min={1}
                placeholder="199"
                value={pricePerDay}
                onChange={(event) => setPricePerDay(event.target.value)}
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">
                Security Deposit (₹)
              </label>

              <Input
                type="number"
                min={0}
                placeholder="1000"
                value={securityDeposit}
                onChange={(event) => setSecurityDeposit(event.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">
              Description
            </label>

            <Textarea
              rows={5}
              placeholder="Describe the item, fabric, fit, usage, etc."
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              maxLength={2000}
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">
              Upload Images
            </label>

            <div className="flex h-40 items-center justify-center rounded-lg border-2 border-dashed text-muted-foreground">
              Image upload isn&apos;t available yet
            </div>
          </div>

          {createMutation.isError && (
            <p className="text-sm text-red-600">
              {(createMutation.error as Error).message}
            </p>
          )}

          <Button
            size="lg"
            className="w-full"
            disabled={!isValid || createMutation.isPending}
            onClick={() => createMutation.mutate()}
          >
            {createMutation.isPending ? 'Publishing...' : 'Publish Listing'}
          </Button>
        </Card>
      </main>
    </AuthGuard>
  );
}
