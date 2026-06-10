// Provider-agnostic mail transport (mirrors the lib/ai adapter pattern). A real
// provider — Resend or Microsoft Graph (CLAUDE.md §2) — is wired when its
// credentials exist; until then the log transport keeps flows shippable "dark".
export interface SendEmailInput {
  to: string;
  subject: string;
  // Plain-text body is required; html is optional and falls back to text.
  text: string;
  html?: string;
}

export interface MailTransport {
  readonly id: string;
  send(input: SendEmailInput): Promise<void>;
}
