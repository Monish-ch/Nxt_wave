/**
 * Cinematic ambient backdrop for the dark "Mission Control" theme:
 * a violet-tinted dot grid masked to the top, three slow-drifting aurora
 * light fields, and a film-grain overlay on top of everything.
 * Pure CSS — no client JS, no images.
 */
export function Backdrop() {
  return (
    <>
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-[#0d0a17]"
      >
        <div className="absolute inset-0 bg-grid-dots opacity-60 [mask-image:radial-gradient(ellipse_75%_55%_at_50%_0%,black,transparent)]" />
        <div className="aurora-blob animate-aurora-a left-[-12%] top-[-16%] size-[560px] bg-violet-700/25" />
        <div className="aurora-blob animate-aurora-b right-[-14%] top-[6%] size-[640px] bg-fuchsia-600/[0.17]" />
        <div className="aurora-blob animate-aurora-c left-[24%] top-[48%] size-[540px] bg-emerald-600/[0.11]" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#0d0a17] to-transparent" />
      </div>
      <div className="grain-overlay" aria-hidden />
    </>
  )
}
