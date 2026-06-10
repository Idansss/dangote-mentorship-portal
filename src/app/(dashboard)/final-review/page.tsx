import { ReviewType } from '@prisma/client';
import { ReviewScreen } from '@/features/reviews/review-screen';

// Final review fill/submit page (CLAUDE.md §5, M3). Thin wrapper over the
// shared, type-parameterized ReviewScreen.
export default function FinalReviewPage() {
  return <ReviewScreen type={ReviewType.FINAL} />;
}
