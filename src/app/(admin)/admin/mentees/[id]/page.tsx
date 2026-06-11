import { notFound } from 'next/navigation';
import { getMenteeDetail } from '@/features/profiles/detail';
import { MenteeDetailView } from '@/features/profiles/profile-detail-view';

// Admin mentee detail (full profile + progress). Admin-gated by the (admin) area
// layout (§4). Reached by clicking a mentee's name anywhere in the admin UI.
export default async function MenteeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const mentee = await getMenteeDetail(id);
  if (!mentee) notFound();
  return <MenteeDetailView mentee={mentee} />;
}
