import 'server-only';
import type { MailTransport, SendEmailInput } from './types';
import { GRAPH_BASE, getGraphToken, isGraphConfigured, readGraphConfig } from '@/lib/graph/client';

// Microsoft Graph mail transport (CLAUDE.md §2). Outbound mail goes through Graph
// using app-only auth (shared lib/graph/client) against a dedicated sender
// mailbox. Like the AI adapter and SSO, it stays dark until credentials are
// supplied — getMailTransport() falls back to the log transport when
// isGraphMailConfigured() is false.

/** Mail uses the shared Graph app credentials. */
export function isGraphMailConfigured(): boolean {
  return isGraphConfigured();
}

export function createGraphMailTransport(): MailTransport {
  const config = readGraphConfig();

  return {
    id: 'microsoft-graph',
    async send(input: SendEmailInput): Promise<void> {
      const token = await getGraphToken(config);
      const message = {
        subject: input.subject,
        body: input.html
          ? { contentType: 'HTML', content: input.html }
          : { contentType: 'Text', content: input.text },
        toRecipients: [{ emailAddress: { address: input.to } }],
      };

      const response = await fetch(
        `${GRAPH_BASE}/users/${encodeURIComponent(config.sender)}/sendMail`,
        {
          method: 'POST',
          headers: {
            authorization: `Bearer ${token}`,
            'content-type': 'application/json',
          },
          body: JSON.stringify({ message, saveToSentItems: false }),
        },
      );
      // sendMail returns 202 Accepted on success.
      if (!response.ok) {
        throw new Error(`Graph sendMail failed: HTTP ${response.status}`);
      }
    },
  };
}

/** Test-only: reset the cached app token between cases. */
export { resetGraphTokenCache } from '@/lib/graph/client';
