import 'server-only';
import type { MeetingProvider } from './types';

// Default meeting provider: persists the meeting in our DB only, with no external
// calendar. Keeps scheduling fully functional before Graph/Zoom are configured —
// exactly like the log mail transport and disabled AI adapter.
export function createNoopMeetingProvider(): MeetingProvider {
  return {
    id: 'noop',
    enabled: false,
    async createEvent() {
      return { externalId: null, joinUrl: null };
    },
    async cancelEvent() {
      // Nothing external to cancel.
    },
  };
}
