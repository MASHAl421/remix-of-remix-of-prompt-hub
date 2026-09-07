/**
 * Ambient cinematic backdrop: slow aurora light, rising bubbles and drifting
 * wildlife silhouettes (fish, whale, jellyfish, birds, butterflies, deer).
 *
 * Purely decorative — fixed behind all content, pointer-events disabled and
 * kept at low opacity so text and images stay perfectly readable.
 */

type Creature = {
  /** viewBox-relative silhouette */
  path: string;
  viewBox: string;
  /** vertical position in vh */
  top: number;
  /** rendered width in px */
  size: number;
  /** seconds for one crossing */
  duration: number;
  delay: number;
  direction: "right" | "left";
  opacity: number;
};

const FISH =
  "M2 32c14-18 34-26 52-26 14 0 26 5 34 13l16-13v52l-16-13c-8 8-20 13-34 13-18 0-38-8-52-26zm44-6a4 4 0 100 8 4 4 0 000-8z";
const WHALE =
  "M4 42c18-22 46-32 74-32 22 0 40 8 50 20 8-10 18-14 28-14-6 8-8 16-6 24 8 4 14 10 18 18-30 14-64 20-92 20-30 0-56-14-72-36zm70-16a4 4 0 100 8 4 4 0 000-8z";
const JELLY =
  "M8 28C8 13 22 2 40 2s32 11 32 26c0 6-4 8-8 8H16c-4 0-8-2-8-8zm10 12c2 14-4 20-2 34 2-12 8-16 8-34zm14 0c1 16-3 24 0 38 3-14 6-22 5-38zm14 0c0 18 6 22 8 34 2-14-4-20-2-34z";
const BIRD =
  "M2 30c14-2 24-10 32-20 4 8 10 12 18 12 8 0 16-4 24-14-2 14-10 24-22 30 12 2 22 0 32-6-10 14-26 22-44 22-20 0-34-8-40-24z";
const BUTTERFLY =
  "M40 34c-6-16-18-30-30-30-8 0-10 10-6 20 4 9 14 14 24 16-10 3-18 10-20 20-3 12 1 20 8 20 10 0 20-14 24-30v-16zm4 0c6-16 18-30 30-30 8 0 10 10 6 20-4 9-14 14-24 16 10 3 18 10 20 20 3 12-1 20-8 20-10 0-20-14-24-30v-16z";
const DEER =
  "M20 12c-4-6-4-10-2-12 3 4 6 6 10 6-2-6 0-10 2-12 1 6 4 10 8 12 4-2 7-6 8-12 2 2 4 6 2 12 4 0 7-2 10-6 2 2 2 6-2 12-3 5-8 8-14 8v10c10 2 18 8 22 18l6 18h-8l-6-14c-4 8-12 12-22 12s-18-4-22-12l-6 14h-8l6-18c4-10 12-16 22-18v-10c-6 0-11-3-14-8z";
const TURTLE =
  "M14 40c0-14 12-24 28-24s28 10 28 24c0 4-2 6-6 6H20c-4 0-6-2-6-6zm-8 2c-4 0-6 2-6 5s3 5 7 4l6-2zm70 0 6 7c4 1 7-1 7-4s-2-5-6-5zM24 48l-4 10h6l4-10zm34 0 4 10h6l-4-10z";

const CREATURES: Creature[] = [
  { path: FISH, viewBox: "0 0 104 64", top: 14, size: 74, duration: 46, delay: 0, direction: "right", opacity: 0.16 },
  { path: FISH, viewBox: "0 0 104 64", top: 62, size: 48, duration: 62, delay: 8, direction: "left", opacity: 0.13 },
  { path: FISH, viewBox: "0 0 104 64", top: 86, size: 34, duration: 38, delay: 20, direction: "right", opacity: 0.1 },
  { path: WHALE, viewBox: "0 0 176 78", top: 40, size: 150, duration: 96, delay: 4, direction: "left", opacity: 0.09 },
  { path: JELLY, viewBox: "0 0 80 78", top: 72, size: 60, duration: 78, delay: 14, direction: "right", opacity: 0.11 },
  { path: BIRD, viewBox: "0 0 96 62", top: 8, size: 46, duration: 34, delay: 6, direction: "left", opacity: 0.14 },
  { path: BIRD, viewBox: "0 0 96 62", top: 26, size: 30, duration: 42, delay: 18, direction: "left", opacity: 0.1 },
  { path: BUTTERFLY, viewBox: "0 0 88 78", top: 50, size: 36, duration: 52, delay: 2, direction: "right", opacity: 0.14 },
  { path: BUTTERFLY, viewBox: "0 0 88 78", top: 32, size: 26, duration: 66, delay: 26, direction: "left", opacity: 0.11 },
  { path: TURTLE, viewBox: "0 0 90 62", top: 78, size: 62, duration: 88, delay: 10, direction: "right", opacity: 0.1 },
  { path: DEER, viewBox: "0 0 84 76", top: 94, size: 54, duration: 72, delay: 30, direction: "left", opacity: 0.09 },
];

const BUBBLES = Array.from({ length: 14 }, (_, i) => ({
  left: (i * 7.3 + 4) % 96,
  size: 4 + ((i * 5) % 12),
  duration: 22 + ((i * 3) % 18),
  delay: (i * 2.4) % 26,
}));

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

      {/* light shafts */}
      <div className="absolute inset-0 bg-[repeating-linear-gradient(105deg,transparent_0_120px,oklch(1_0_0/0.022)_120px_190px)]" />

      {/* drifting wildlife */}
      {CREATURES.map((c, i) => (
        <div
          key={i}
          className="absolute left-0"
          style={{
            top: `${c.top}vh`,
            animation: `${c.direction === "right" ? "swim-right" : "swim-left"} ${c.duration}s linear infinite`,
            animationDelay: `-${c.delay}s`,
          }}
        >
          <svg
            viewBox={c.viewBox}
            width={c.size}
            height={c.size * 0.7}
            className="text-primary"
            style={{ opacity: c.opacity, animation: `bob ${6 + (i % 5)}s ease-in-out infinite` }}
          >
            <path d={c.path} fill="currentColor" />
          </svg>
        </div>
      ))}

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
      <div className="absolute inset-0 bg-[radial-gradient(75%_60%_at_50%_40%,transparent,oklch(0.12_0.01_60/0.72))]" />
    </div>
  );
}
