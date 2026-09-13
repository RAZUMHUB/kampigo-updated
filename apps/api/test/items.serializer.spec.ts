import { toPublicLostItem } from '../src/items/items.serializer';

describe('toPublicLostItem', () => {
  it('never includes privateDetails in the output', () => {
    const item = {
      id: 'item_1',
      title: 'Black keys',
      privateDetails: { hiddenSticker: 'encrypted-blob' },
    };
    const publicItem = toPublicLostItem(item) as any;
    expect(publicItem.privateDetails).toBeUndefined();
    expect(publicItem.title).toBe('Black keys');
  });

  it('exposes only a boolean hasPrivateDetails flag to the owner, never the raw content', () => {
    const item = { id: 'item_1', title: 'Black keys', privateDetails: { hiddenSticker: 'x' } };
    const ownerView = toPublicLostItem(item, true) as any;
    expect(ownerView.hasPrivateDetails).toBe(true);
    expect(ownerView.privateDetails).toBeUndefined();
  });
});
