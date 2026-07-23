"use client";

import {
  type CSSProperties,
  type ElementType,
  type ReactNode,
  useEffect,
  useRef,
  useState,
} from "react";

type CountUpStatProps = {
  end: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  durationMs?: number;
  className?: string;
};

type MotionRevealProps = {
  children: ReactNode;
  as?: ElementType;
  className?: string;
  delayMs?: number;
};

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function formatCount(value: number, decimals = 0) {
  return new Intl.NumberFormat("en", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

export function CountUpStat({
  end,
  prefix = "",
  suffix = "",
  decimals = 0,
  durationMs = 760,
  className,
}: CountUpStatProps) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const [value, setValue] = useState(end);

  useEffect(() => {
    const element = ref.current;
    if (!element || prefersReducedMotion()) {
      setValue(end);
      return;
    }

    let frame = 0;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;

        const startedAt = performance.now();

        function tick(now: number) {
          const progress = Math.min((now - startedAt) / durationMs, 1);
          const eased = 1 - Math.pow(1 - progress, 3);
          setValue(end * eased);

          if (progress < 1) {
            frame = requestAnimationFrame(tick);
          }
        }

        setValue(0);
        frame = requestAnimationFrame(tick);
        observer.disconnect();
      },
      { threshold: 0.48 },
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [decimals, durationMs, end]);

  return (
    <span ref={ref} className={className}>
      {prefix}
      {formatCount(value, decimals)}
      {suffix}
    </span>
  );
}

export function MotionReveal({
  children,
  as: Component = "div",
  className = "",
  delayMs = 0,
}: MotionRevealProps) {
  const ref = useRef<HTMLElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element || prefersReducedMotion()) {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        setVisible(true);
        observer.disconnect();
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.16 },
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, []);

  return (
    <Component
      ref={ref}
      className={`marketing-reveal ${visible ? "marketing-reveal-visible" : ""} ${className}`}
      style={{ "--motion-delay": `${delayMs}ms` } as CSSProperties}
    >
      {children}
    </Component>
  );
}
