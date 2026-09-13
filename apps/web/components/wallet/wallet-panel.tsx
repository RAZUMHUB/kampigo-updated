'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Wallet as WalletIcon } from 'lucide-react';
import { api } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

const TOPUP_PRESETS = [100, 200, 500];
const RAZORPAY_CHECKOUT_URL = 'https://checkout.razorpay.com/v1/checkout.js';

interface RazorpayOrder {
  id: string;
  amount: number;
  currency: string;
  status?: string;
}

interface TopupOrderResponse {
  ledgerEntryId: string;
  alreadyExists?: boolean;
  razorpayOrder?: RazorpayOrder;
  checkoutKeyId?: string | null;
}

interface RazorpayPaymentResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler: (response: RazorpayPaymentResponse) => void;
  modal?: {
    ondismiss?: () => void;
  };
  theme?: {
    color?: string;
  };
}

interface RazorpayCheckout {
  open: () => void;
  on: (
    event: string,
    callback: (response: { error?: { description?: string } }) => void,
  ) => void;
}

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => RazorpayCheckout;
  }
}

function formatRupees(paise: number) {
  return `Rs. ${(paise / 100).toFixed(0)}`;
}

function loadRazorpayCheckout(): Promise<void> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Payment checkout is unavailable.'));
  }

  if (window.Razorpay) {
    return Promise.resolve();
  }

  const existingScript = document.querySelector<HTMLScriptElement>(
    `script[src="${RAZORPAY_CHECKOUT_URL}"]`,
  );

  if (existingScript) {
    return new Promise((resolve, reject) => {
      existingScript.addEventListener(
        'load',
        () => resolve(),
        { once: true },
      );
      existingScript.addEventListener(
        'error',
        () => reject(new Error('Could not load Razorpay Checkout.')),
        { once: true },
      );
    });
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = RAZORPAY_CHECKOUT_URL;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () =>
      reject(new Error('Could not load Razorpay Checkout.'));
    document.body.appendChild(script);
  });
}

export function WalletPanel() {
  const queryClient = useQueryClient();
  const [customAmount, setCustomAmount] = useState('');
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [paymentMessage, setPaymentMessage] = useState<string | null>(null);
  const hasAccessToken = api.hasAccessToken();

  const { data: balance, isLoading: balanceLoading } = useQuery<{
    balancePaise: number;
  }>({
    queryKey: ['wallet', 'balance'],
    queryFn: () => api.get('/wallet/balance'),
    enabled: hasAccessToken,
  });

  const { data: transactions } = useQuery<any[]>({
    queryKey: ['wallet', 'transactions'],
    queryFn: () => api.get('/wallet/transactions'),
    enabled: hasAccessToken,
  });

  const topupMutation = useMutation({
    mutationFn: (amountInRupees: number) =>
      api.post<TopupOrderResponse>('/wallet/topup/order', {
        amountInRupees,
        idempotencyKey: `topup-${Date.now()}-${Math.random()
          .toString(36)
          .slice(2)}`,
      }),
    onMutate: () => {
      setCheckoutError(null);
      setPaymentMessage(null);
    },
    onSuccess: async (result) => {
      try {
        if (result.alreadyExists) {
          throw new Error(
            'This top-up request already exists. Please start a new top-up.',
          );
        }

        const order = result.razorpayOrder;
        const checkoutKeyId = result.checkoutKeyId;

        if (!order) {
          throw new Error('Payment order was not returned by the server.');
        }

        if (order.id.startsWith('order_mock_') || !checkoutKeyId) {
          throw new Error(
            'Razorpay is not configured. Add the Razorpay credentials to the server environment.',
          );
        }

        await loadRazorpayCheckout();

        if (!window.Razorpay) {
          throw new Error('Razorpay Checkout is unavailable.');
        }

        const checkout = new window.Razorpay({
          key: checkoutKeyId,
          amount: order.amount,
          currency: order.currency,
          name: 'Campigo',
          description: 'Wallet top-up',
          order_id: order.id,
          handler: () => {
            setCheckoutError(null);
            setPaymentMessage(
              'Payment received. Wallet balance will update after payment verification.',
            );

            window.setTimeout(() => {
              queryClient.invalidateQueries({ queryKey: ['wallet'] });
            }, 1500);

            window.setTimeout(() => {
              queryClient.invalidateQueries({ queryKey: ['wallet'] });
            }, 5000);
          },
          modal: {
            ondismiss: () => {
              setPaymentMessage(null);
            },
          },
        });

        checkout.on('payment.failed', (response) => {
          setPaymentMessage(null);
          setCheckoutError(
            response.error?.description ?? 'Payment failed. Please try again.',
          );
        });

        checkout.open();
      } catch (error) {
        setPaymentMessage(null);
        setCheckoutError(
          error instanceof Error
            ? error.message
            : 'Could not start payment checkout.',
        );
      }
    },
    onError: (error) => {
      setPaymentMessage(null);
      setCheckoutError(
        error instanceof Error
          ? error.message
          : 'Could not create the payment order.',
      );
    },
  });

  return (
    <div className="flex flex-col gap-4">
      <Card className="flex items-center justify-between bg-ink-700 text-surface">
        <div>
          <p className="flex items-center gap-2 text-sm text-ink-100">
            <WalletIcon className="h-4 w-4" /> Wallet balance
          </p>

          {balanceLoading ? (
            <Skeleton className="mt-1 h-8 w-24 bg-ink-500" />
          ) : (
            <p className="font-display text-3xl font-bold">
              {formatRupees(balance?.balancePaise ?? 0)}
            </p>
          )}
        </div>
      </Card>

      <Card>
        <p className="mb-3 text-sm font-medium text-ink-700">
          Add money (minimum Rs. 100)
        </p>

        <div className="flex gap-2">
          {TOPUP_PRESETS.map((amount) => (
            <Button
              key={amount}
              variant="secondary"
              size="sm"
              disabled={!hasAccessToken || topupMutation.isPending}
              onClick={() => topupMutation.mutate(amount)}
            >
              Rs. {amount}
            </Button>
          ))}
        </div>

        <div className="mt-3 flex gap-2">
          <input
            className="input"
            type="number"
            min={100}
            placeholder="Custom amount (min Rs. 100)"
            value={customAmount}
            onChange={(e) => setCustomAmount(e.target.value)}
          />

          <Button
            disabled={
              !hasAccessToken ||
              !customAmount ||
              Number(customAmount) < 100 ||
              topupMutation.isPending
            }
            onClick={() => topupMutation.mutate(Number(customAmount))}
          >
            {topupMutation.isPending ? 'Starting...' : 'Add'}
          </Button>
        </div>

        {Number(customAmount) > 0 && Number(customAmount) < 100 && (
          <p className="mt-1 text-xs text-red-600">
            Minimum top-up amount is Rs. 100.
          </p>
        )}

        {checkoutError && (
          <p className="mt-3 text-sm text-red-600">
            {checkoutError}
          </p>
        )}

        {paymentMessage && (
          <p className="mt-3 text-sm text-ink-500">
            {paymentMessage}
          </p>
        )}
      </Card>

      <Card>
        <p className="mb-3 text-sm font-medium text-ink-700">
          Transaction history
        </p>

        {!transactions || transactions.length === 0 ? (
          <p className="text-sm text-ink-400">
            No transactions yet.
          </p>
        ) : (
          <div className="flex flex-col divide-y divide-ink-100">
            {transactions.map((tx) => (
              <div
                key={tx.id}
                className="flex items-center justify-between py-2 text-sm"
              >
                <div>
                  <p className="text-ink-800">
                    {tx.description}
                  </p>

                  <p className="text-xs text-ink-400">
                    {new Date(tx.createdAt).toLocaleString()}
                  </p>
                </div>

                <span
                  className={
                    tx.type === 'CREDIT'
                      ? 'font-medium text-green-600'
                      : 'font-medium text-red-600'
                  }
                >
                  {tx.type === 'CREDIT' ? '+' : '-'}
                  {formatRupees(tx.amountPaise)}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
