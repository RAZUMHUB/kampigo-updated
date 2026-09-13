/**
 * Provider-agnostic email interface. Swap the Resend implementation for any
 * other transactional email provider without touching call sites.
 */
export interface EmailProvider {
  send(params: { to: string; subject: string; html: string; text: string }): Promise<void>;
}
