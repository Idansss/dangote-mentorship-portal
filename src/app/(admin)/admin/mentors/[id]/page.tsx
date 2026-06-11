import { notFound } from 'next/navigation';
import { getMentorDetail } from '@/features/profiles/detail';
import { MentorDetailView } from '@/features/profiles/profile-detail-view';

// Admin mentor detail (full profile + progress). Admin-gated by the (admin) area
// layout (§4). Reached by clicking a mentor's name anywhere in the admin UI.
export default async function MentorDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const mentor = await getMentorDetail(id);
  if (!mentor) notFound();
  return <MentorDetailView mentor={mentor} />;
}
