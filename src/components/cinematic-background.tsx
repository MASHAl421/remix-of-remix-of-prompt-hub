/**
 * Ambient cinematic backdrop: slow aurora light, rising bubbles and real
 * photographic wildlife (fish, whale, jellyfish, sea turtle, eagle, butterfly)
 * drifting across the whole viewport.
 *
 * Purely decorative — fixed, pointer-events disabled, moderate opacity so text
 * and images stay perfectly readable.
 */
import fish1 from "@/assets/creatures/fish-1.png";
import fish2 from "@/assets/creatures/fish-2.png";
import fish3 from "@/assets/creatures/fish-3.png";
import whale from "@/assets/creatures/whale.png";
import jellyfish from "@/assets/creatures/jellyfish.png";
import turtle from "@/assets/creatures/turtle.png";
import bird from "@/assets/creatures/bird.png";
import butterfly from "@/assets/creatures/butterfly.png";

type Creature = {
  src: string;
  alt: string;
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

const CREATURES: Creature[] = [
  { src: fish1, alt: "", top: 8, size: 130, duration: 26, delay: 0, direction: "right", opacity: 0.5 },
  { src: fish2, alt: "", top: 26, size: 110, duration: 34, delay: 6, direction: "left", opacity: 0.45 },
  { src: fish3, alt: "", top: 44, size: 90, duration: 22, delay: 11, direction: "right", opacity: 0.45 },
  { src: fish1, alt: "", top: 62, size: 70, duration: 30, delay: 17, direction: "left", opacity: 0.38 },
  { src: fish3, alt: "", top: 80, size: 105, duration: 27, delay: 3, direction: "right", opacity: 0.42 },
  { src: fish2, alt: "", top: 94, size: 80, duration: 36, delay: 21, direction: "left", opacity: 0.36 },
  { src: whale, alt: "", top: 52, size: 300, duration: 58, delay: 8, direction: "left", opacity: 0.3 },
  { src: jellyfish, alt: "", top: 70, size: 120, duration: 46, delay: 5, direction: "right", opacity: 0.38 },
  { src: jellyfish, alt: "", top: 16, size: 90, duration: 54, delay: 24, direction: "left", opacity: 0.32 },
  { src: turtle, alt: "", top: 86, size: 140, duration: 44, delay: 13, direction: "right", opacity: 0.36 },
  { src: bird, alt: "", top: 4, size: 130, duration: 20, delay: 2, direction: "left", opacity: 0.42 },
  { src: bird, alt: "", top: 34, size: 90, duration: 25, delay: 15, direction: "left", opacity: 0.34 },
  { src: butterfly, alt: "", top: 58, size: 70, duration: 24, delay: 9, direction: "right", opacity: 0.45 },
  { src: butterfly, alt: "", top: 76, size: 52, duration: 31, delay: 19, direction: "left", opacity: 0.4 },
];

/** A couple of very soft, blurred creatures that pass in front of the content
 * for depth — kept faint so nothing becomes hard to read. */
const FOREGROUND: Creature[] = [
  { src: fish1, alt: "", top: 38, size: 190, duration: 40, delay: 4, direction: "right", opacity: 0.1 },
  { src: fish3, alt: "", top: 72, size: 150, duration: 48, delay: 22, direction: "left", opacity: 0.09 },
];

const BUBBLES = Array.from({ length: 16 }, (_, i) => ({
  left: (i * 6.3 + 3) % 96,
  size: 4 + ((i * 5) % 12),
  duration: 18 + ((i * 3) % 16),
  delay: (i * 2.1) % 22,
}));

function Swimmer({
  c,
  i,
  blur,
  mobileHidden,
}: {
  c: Creature;
  i: number;
  blur?: boolean;
  mobileHidden?: boolean;
}) {
  return (
    <div
      className={mobileHidden ? "absolute left-0 hidden sm:block" : "absolute left-0"}
      style={{
        top: `${c.top}vh`,
        animation: `${c.direction === "right" ? "swim-right" : "swim-left"} ${c.duration}s linear infinite`,
        animationDelay: `-${c.delay}s`,
      }}
    >
      <img
        src={c.src}
        alt={c.alt}
        loading="lazy"
        width={c.size}
        style={{
          width: `min(${c.size}px, 40vw)`,
          height: "auto",
          opacity: c.opacity,
          filter: blur
            ? "blur(6px) saturate(1.05)"
            : "drop-shadow(0 12px 26px oklch(0 0 0/0.5)) saturate(1.1)",
          animation: `bob ${4 + (i % 4)}s ease-in-out infinite`,
        }}
      />
    </div>
  );
}

export function CinematicBackground() {
  return (
    <>
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
          <Swimmer key={i} c={c} i={i} />
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
        <div className="absolute inset-0 bg-[radial-gradient(78%_62%_at_50%_40%,transparent,oklch(0.12_0.01_60/0.55))]" />
      </div>

      {/* faint foreground pass-bys, in front of content but non-interactive */}
      <div aria-hidden className="pointer-events-none fixed inset-0 z-40 overflow-hidden">
        {FOREGROUND.map((c, i) => (
          <Swimmer key={i} c={c} i={i} blur />
        ))}
      </div>
    </>
  );
}
