import { prisma } from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/auth/rbac';
import { getStorageProvider } from '@/lib/storage';

// Streams a user's profile photo. Outside the auth middleware matcher (/api), so
// authorization is enforced here: any authenticated portal user may view another
// member's avatar (avatars show in nav, lists, and threads), but never anonymous
// — the image key is opaque and never exposed as a public URL (CLAUDE.md §14).
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const viewer = await getCurrentUser();
  if (!viewer) return new Response('Unauthorized', { status: 401 });

  const { id } = await params;
  const user = await prisma.user.findUnique({
    where: { id },
    select: { image: true, deletedAt: true },
  });

  if (!user || user.deletedAt || !user.image) {
    return new Response('Not found', { status: 404 });
  }

  let bytes: Uint8Array;
  try {
    bytes = await getStorageProvider().get(user.image);
  } catch {
    return new Response('Image unavailable', { status: 404 });
  }

  const ext = user.image.split('.').pop()?.toLowerCase();
  const contentType =
    ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';

  return new Response(Buffer.from(bytes), {
    status: 200,
    headers: {
      'content-type': contentType,
      // Private: the URL is per-user and behind auth; allow brief client caching.
      'cache-control': 'private, max-age=300',
    },
  });
}
