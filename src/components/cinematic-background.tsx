/**
 * Ambient cinematic backdrop: slow aurora light, rising bubbles and real
 * filmed wildlife footage (shot against black, blended in with `screen` so the
 * black drops out like a green-screen key) drifting behind the whole page.
 *
 * Purely decorative — fixed, pointer-events disabled, moderate opacity so text
 * and images stay perfectly readable.
 */
import wildlifeLoop from "@/assets/creatures/wildlife-loop.mp4.asset.json";
import skyLoop from "@/assets/creatures/sky-loop.mp4.asset.json";

const BUBBLES = Array.from({ length: 16 }, (_, i) => ({
  left: (i * 6.3 + 3) % 96,
  size: 4 + ((i * 5) % 12),
  duration: 18 + ((i * 3) % 16),
  delay: (i * 2.1) % 22,
}));

function WildlifeVideo({
  src,
  className,
}: {
  src: string;
  className: string;
}) {
  return (
    <video
      src={src}
      autoPlay
      loop
      muted
      playsInline
      preload="auto"
      aria-hidden
      tabIndex={-1}
      className={`wildlife-video pointer-events-none absolute h-full w-full object-cover motion-reduce:hidden ${className}`}
    />
  );
}

export function CinematicBackground() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {/* deep base wash */}
      <div className="cinematic-wash absolute inset-0" />

      {/* slow aurora lights */}
      <div
        className="absolute -left-40 top-[-10%] size-[46rem] rounded-full bg-primary/12 blur-[110px]"
        style={{ animation: "aurora-drift 26s ease-in-out infinite" }}
      />
      <div
        className="absolute -right-52 top-1/3 size-[40rem] rounded-full bg-chart-2/15 blur-[120px]"
        style={{ animation: "aurora-drift 34s ease-in-out infinite", animationDelay: "-8s" }}
      />
      <div
        className="absolute bottom-[-20%] left-1/4 size-[38rem] rounded-full bg-chart-4/12 blur-[130px]"
        style={{ animation: "aurora-drift 30s ease-in-out infinite", animationDelay: "-16s" }}
      />

      {/* real filmed wildlife, keyed out of its black background */}
      <WildlifeVideo src={wildlifeLoop.url} className="inset-0 wildlife-video-primary" />
      <WildlifeVideo src={skyLoop.url} className="inset-0 hidden sm:block wildlife-video-secondary" />

      {/* light shafts */}
      <div className="cinematic-shafts absolute inset-0" />

      {/* rising bubbles */}
      {BUBBLES.map((b, i) => (
        <span
          key={i}
          className="absolute bottom-0 rounded-full border border-foreground/15 bg-foreground/5"
          style={{
            left: `${b.left}%`,
            width: b.size,
            height: b.size,
            animation: `bubble-rise ${b.duration}s linear infinite`,
            animationDelay: `-${b.delay}s`,
          }}
        />
      ))}

      {/* cinematic vignette keeps text crisp */}
      <div className="cinematic-vignette absolute inset-0" />
    </div>
  );
}
