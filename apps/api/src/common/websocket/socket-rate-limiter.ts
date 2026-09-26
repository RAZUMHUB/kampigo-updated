import { Socket } from 'socket.io';

const WINDOW_MS = 60_000;
const MAX_EVENTS_PER_WINDOW = 60;

const state = new WeakMap<Socket, { count: number; resetAt: number }>();

export function enforceSocketRateLimit(client: Socket): void {
  const now = Date.now();
  const current = state.get(client);

  if (!current || now >= current.resetAt) {
    state.set(client, {
      count: 1,
      resetAt: now + WINDOW_MS,
    });
    return;
  }

  current.count += 1;

  if (current.count > MAX_EVENTS_PER_WINDOW) {
    throw new Error('WebSocket rate limit exceeded');
  }
}
