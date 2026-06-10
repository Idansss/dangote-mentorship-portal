// Microsoft Entra ID is the primary provider (CLAUDE.md §2), but tenant
// credentials are an ask-first decision (rule 3). Until Dangote supplies them,
// the login page hides the SSO button instead of showing one that errors.
export function isEntraConfigured(): boolean {
  return Boolean(
    process.env.AUTH_MICROSOFT_ENTRA_ID_ID &&
      process.env.AUTH_MICROSOFT_ENTRA_ID_SECRET &&
      process.env.AUTH_MICROSOFT_ENTRA_ID_TENANT_ID,
  );
}
