import { Sparkles, Target, UserRound } from 'lucide-react';

export function MentorshipAnimation({ label }: { label: string }) {
  return (
    <div
      role="img"
      aria-label={label}
      className="mentorship-animation relative mb-7 inline-flex h-16 w-[17.5rem] items-center justify-center overflow-hidden rounded-full border border-[#10b91f]/20 bg-white/80 px-5 shadow-elevation backdrop-blur-sm"
    >
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-r from-[#10b91f]/5 via-white to-[#d39b2b]/10"
      />

      <div aria-hidden className="relative flex w-full items-center justify-between">
        <span className="mentorship-person mentorship-person-left inline-flex size-10 items-center justify-center rounded-full bg-[#10b91f] text-white shadow-sm">
          <UserRound className="size-5" strokeWidth={2.25} />
        </span>

        <span className="mentorship-connection relative h-px flex-1 bg-[#10b91f]/25">
          <span className="mentorship-traveller mentorship-traveller-forward absolute -top-1 size-2 rounded-full bg-[#10b91f] shadow-[0_0_0_4px_rgba(16,185,31,0.12)]" />
        </span>

        <span className="mentorship-goal relative mx-3 inline-flex size-11 items-center justify-center rounded-full border border-[#d39b2b]/30 bg-[#d39b2b]/10 text-[#a67214]">
          <span className="mentorship-goal-ring absolute inset-0 rounded-full border border-[#d39b2b]/35" />
          <Target className="size-5" strokeWidth={2.25} />
          <Sparkles className="mentorship-spark absolute -right-2 -top-2 size-4 text-[#d39b2b]" />
        </span>

        <span className="mentorship-connection relative h-px flex-1 bg-[#10b91f]/25">
          <span className="mentorship-traveller mentorship-traveller-back absolute -top-1 size-2 rounded-full bg-[#d39b2b] shadow-[0_0_0_4px_rgba(211,155,43,0.12)]" />
        </span>

        <span className="mentorship-person mentorship-person-right inline-flex size-10 items-center justify-center rounded-full border border-[#10b91f]/25 bg-[#10b91f]/10 text-[#087c15] shadow-sm">
          <UserRound className="size-5" strokeWidth={2.25} />
        </span>
      </div>
    </div>
  );
}
