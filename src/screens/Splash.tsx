import { Logo } from '../components/ui';

// Exact recreation of the Figma "Splash 1 -> Splash 2" prototype transition:
// two grey diagonal panels (constant 22.9deg rotation) shrink and recolor into
// navy/teal corner ribbons, the base gradient crossfades from dark-top to
// light-top, and the logo scales up from ~21% while fading in. All position,
// size and color values are taken directly from the two Figma frames.
export default function Splash() {
  return (
    <div
      className="relative h-full overflow-hidden"
      style={{ background: 'linear-gradient(180deg, #334f90 0%, #0f172a 100%)' }}
    >
      <div
        className="bg-crossfade absolute inset-0"
        style={{ background: 'linear-gradient(180deg, #0f172a 0%, #334f90 100%)' }}
        aria-hidden="true"
      />
      <div
        className="wipe-a absolute"
        style={{ transform: 'rotate(22.9deg)', transformOrigin: 'center' }}
        aria-hidden="true"
      />
      <div
        className="wipe-b absolute shadow-[10px_0px_30px_0px_rgba(255,255,255,0.35)]"
        style={{ transform: 'rotate(22.9deg)', transformOrigin: 'center' }}
        aria-hidden="true"
      />
      <div className="logo-in absolute left-1/2 top-1/2">
        <Logo size={56} light />
      </div>
    </div>
  );
}
