export function WarpWait() {
  return (
    <div className="warp-hud" aria-busy="true" aria-live="polite">
      <div className="warp-streaks" aria-hidden="true" />
      <p className="warp-label font-display">Warp speed…</p>
      <p className="warp-sub text-xs text-slate-400">Cosmo is crossing light-seconds to answer you</p>
    </div>
  );
}
