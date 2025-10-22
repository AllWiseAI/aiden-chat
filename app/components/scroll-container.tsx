import { ReactNode, useEffect, useRef } from "react";
import clsx from "clsx";

export default function ScrollContainer({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let hideTimer: number | null = null;

    const onScroll = () => {
      el.classList.add("scrolling");
      if (hideTimer) {
        window.clearTimeout(hideTimer);
      }
      hideTimer = window.setTimeout(() => {
        el.classList.remove("scrolling");
        hideTimer = null;
      }, 600);
    };

    el.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      el.removeEventListener("scroll", onScroll);
      if (hideTimer) window.clearTimeout(hideTimer);
    };
  }, []);

  return (
    <div ref={ref} className={clsx("scroll-wrap", className)}>
      {children}
    </div>
  );
}
