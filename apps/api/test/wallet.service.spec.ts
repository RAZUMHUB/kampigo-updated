import { WalletService, MIN_WALLET_TOPUP_PAISE, LOST_ITEM_ALERT_PRICE_PAISE } from '../src/wallet/wallet.service';

describe('Wallet business rules', () => {
  it('MIN_WALLET_TOPUP_PAISE equals Rs. 100', () => {
    expect(MIN_WALLET_TOPUP_PAISE).toBe(10000);
  });

  it('LOST_ITEM_ALERT_PRICE_PAISE equals Rs. 29', () => {
    expect(LOST_ITEM_ALERT_PRICE_PAISE).toBe(2900);
  });

  it('rejects top-up amounts below Rs. 100', async () => {
    const prismaMock: any = {
      wallet: { upsert: jest.fn().mockResolvedValue({ id: 'wallet_1' }) },
      walletLedgerEntry: { findUnique: jest.fn().mockResolvedValue(null) },
    };
    const razorpayMock: any = { createOrder: jest.fn() };
    const service = new WalletService(prismaMock, razorpayMock);

    await expect(
      service.createTopupOrder('user_1', 'univ_1', 50, 'idem-1'),
    ).rejects.toThrow('Minimum wallet top-up amount is Rs. 100');

    await expect(
      service.createTopupOrder('user_1', 'univ_1', 99, 'idem-2'),
    ).rejects.toThrow();
  });

  it('accepts top-up amounts of Rs. 100 or more', async () => {
    const prismaMock: any = {
      wallet: { upsert: jest.fn().mockResolvedValue({ id: 'wallet_1' }) },
      walletLedgerEntry: {
        findUnique: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue({ id: 'ledger_1' }),
      },
    };
    const razorpayMock: any = { createOrder: jest.fn().mockResolvedValue({ id: 'order_1' }) };
    const service = new WalletService(prismaMock, razorpayMock);

    const result = await service.createTopupOrder('user_1', 'univ_1', 100, 'idem-3');
    expect(result.ledgerEntryId).toBe('ledger_1');
    expect(razorpayMock.createOrder).toHaveBeenCalledWith(10000, 'idem-3');
  });

  it('is idempotent: returns existing entry for a repeated idempotency key', async () => {
    const prismaMock: any = {
      wallet: { upsert: jest.fn() },
      walletLedgerEntry: { findUnique: jest.fn().mockResolvedValue({ id: 'existing_ledger' }) },
    };
    const razorpayMock: any = { createOrder: jest.fn() };
    const service = new WalletService(prismaMock, razorpayMock);

    const result = await service.createTopupOrder('user_1', 'univ_1', 200, 'idem-4');
    expect(result.alreadyExists).toBe(true);
    expect(razorpayMock.createOrder).not.toHaveBeenCalled();
  });
});
