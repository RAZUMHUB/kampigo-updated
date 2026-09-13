import { clsx } from 'clsx';

/**
 * Never displays raw similarity scores or fake percentages - only the
 * qualitative tiers defined by the product spec, until proper statistical
 * calibration exists.
 */
export function MatchTierBadge({ tier }: { tier: 'HIGHLY_LIKELY' | 'POSSIBLE' | 'WEAK' }) {
  const label = tier === 'HIGHLY_LIKELY' ? 'Highly Likely Match' : tier === 'POSSIBLE' ? 'Possible Match' : 'Weak Match';
  return (
    <span
      className={clsx(
        'inline-flex w-fit items-center rounded-full px-2.5 py-1 text-xs font-semibold',
        tier === 'HIGHLY_LIKELY' && 'bg-amber-400/20 text-amber-600',
        tier === 'POSSIBLE' && 'bg-ink-100 text-ink-600',
        tier === 'WEAK' && 'bg-ink-50 text-ink-400',
      )}
    >
      {label}
    </span>
  );
}
