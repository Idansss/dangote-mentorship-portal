// Auth chrome (Stitch redesign — docs/stitch-redesign.md). A calm, centered
// single-column surface on the light canvas with two soft teal "ambient glow"
// spots, matching the Stitch Login screen. Wraps every auth page (login, signup,
// forgot/reset, invite) so they share the same frame; each page supplies its own
// brand header / card / footer.
export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-bg px-4 py-12">
      {/* Atmospheric teal glow spots (decorative) */}
      <div
        aria-hidden
        className="pointer-events-none absolute -left-48 -top-48 size-[600px] rounded-full bg-green-light/10 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-48 -right-48 size-[600px] rounded-full bg-green-light/10 blur-3xl"
      />
      <main className="relative w-full max-w-[440px]">{children}</main>
    </div>
  );
}
