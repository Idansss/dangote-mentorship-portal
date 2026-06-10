// Provider-agnostic object storage (mirrors lib/ai and lib/mail). Feature code
// depends only on this interface; swapping the local-filesystem provider for
// Supabase Storage (CLAUDE.md §2) touches lib/storage alone. Files are addressed
// by an opaque key; access control lives in the routes that serve them, never in
// a public URL (CLAUDE.md §14: agreements/messages are confidential records).
export interface PutObjectInput {
  key: string;
  bytes: Uint8Array;
  contentType: string;
}

export interface StorageProvider {
  readonly id: string;
  put(input: PutObjectInput): Promise<void>;
  get(key: string): Promise<Uint8Array>;
}
