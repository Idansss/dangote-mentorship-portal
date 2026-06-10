import { prisma } from '@/lib/db/prisma';
import { getCurrentUser, hasAnyRole } from '@/lib/auth/rbac';
import { ADMIN_ROLES } from '@/lib/auth/roles';
import { getStorageProvider } from '@/lib/storage';

// Streams a signed agreement PDF. This route is OUTSIDE the auth middleware
// matcher (which excludes /api), so authorization is enforced here: only the
// signer or a programme admin may read it (CLAUDE.md §4, §14 — confidential
// records, never a public URL).
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) return new Response('Unauthorized', { status: 401 });

  const { id } = await params;
  const agreement = await prisma.agreement.findUnique({
    where: { id },
    select: { signedById: true, pdfUrl: true, type: true, deletedAt: true },
  });

  if (!agreement || agreement.deletedAt) {
    return new Response('Not found', { status: 404 });
  }

  const isOwner = agreement.signedById === user.id;
  const isAdmin = hasAnyRole(user, ADMIN_ROLES);
  if (!isOwner && !isAdmin) {
    return new Response('Forbidden', { status: 403 });
  }

  if (!agreement.pdfUrl) {
    return new Response('PDF not ready', { status: 404 });
  }

  let bytes: Uint8Array;
  try {
    bytes = await getStorageProvider().get(agreement.pdfUrl);
  } catch {
    return new Response('PDF unavailable', { status: 404 });
  }

  const filename = `${agreement.type.toLowerCase()}-agreement.pdf`;
  return new Response(Buffer.from(bytes), {
    status: 200,
    headers: {
      'content-type': 'application/pdf',
      'content-disposition': `inline; filename="${filename}"`,
      'cache-control': 'private, no-store',
    },
  });
}
