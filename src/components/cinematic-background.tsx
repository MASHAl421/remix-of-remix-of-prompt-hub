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
  opacity,
}: {
  src: string;
  className: string;
  opacity: number;
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
      className={`pointer-events-none absolute h-full w-full object-cover mix-blend-screen motion-reduce:hidden ${className}`}
      style={{ opacity }}
    />
  );
}

export function CinematicBackground() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {/* deep base wash */}
      <div className="absolute inset-0 bg-[radial-gradient(120%_90%_at_50%_-10%,oklch(0.28_0.05_215/0.55),transparent_60%),radial-gradient(100%_80%_at_80%_110%,oklch(0.32_0.06_170/0.45),transparent_65%)]" />

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
      <WildlifeVideo src={wildlifeLoop.url} className="inset-0" opacity={0.55} />
      <WildlifeVideo src={skyLoop.url} className="inset-0 hidden sm:block" opacity={0.4} />

      {/* light shafts */}
      <div className="absolute inset-0 bg-[repeating-linear-gradient(105deg,transparent_0_120px,oklch(1_0_0/0.022)_120px_190px)]" />

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
      <div className="absolute inset-0 bg-[radial-gradient(78%_62%_at_50%_40%,transparent,oklch(0.12_0.01_60/0.55))]" />
    </div>
  );
}
