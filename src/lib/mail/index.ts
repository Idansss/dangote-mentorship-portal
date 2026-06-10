import 'server-only';
import type { MailTransport, SendEmailInput } from './types';
import { createGraphMailTransport, isGraphMailConfigured } from './graph';

export type { MailTransport, SendEmailInput } from './types';

// Default transport: log the email instead of sending it. This keeps auth flows
// (e.g. password reset) fully functional in dev/CI and before a provider is
// configured, without leaking message bodies into structured logs in prod —
// the body is only printed when MAIL_DEBUG is on.
const logTransport: MailTransport = {
  id: 'log',
  async send(input: SendEmailInput): Promise<void> {
    if (process.env.MAIL_DEBUG === 'true') {
      console.info(`[mail:log] to=${input.to} subject="${input.subject}"\n${input.text}`);
    } else {
      console.info(`[mail:log] to=${input.to} subject="${input.subject}" (set MAIL_DEBUG=true to print body)`);
    }
  },
};

let cached: MailTransport | null = null;

// Selects the active transport behind an env check — exactly like getAiAdapter().
// Microsoft Graph when its credentials exist (CLAUDE.md §2), else the log
// transport so flows stay shippable dark. Call sites never change.
export function getMailTransport(): MailTransport {
  if (cached) return cached;
  cached = isGraphMailConfigured() ? createGraphMailTransport() : logTransport;
  return cached;
}

/** Convenience wrapper used by features that just need to send one email. */
export async function sendEmail(input: SendEmailInput): Promise<void> {
  await getMailTransport().send(input);
}
