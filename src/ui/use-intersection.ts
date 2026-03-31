"use client";

import { useEffect, useRef, useState } from "react";

export function useIntersection<T extends Element>(opts?: IntersectionObserverInit) {
  const ref = useRef<T | null>(null);
  const [isIntersecting, setIsIntersecting] = useState(false);

  useEffect(() => {
    if (!ref.current) return;
    const el = ref.current;
    const observer = new IntersectionObserver(([entry]) => {
      setIsIntersecting(!!entry?.isIntersecting);
    }, opts);
    observer.observe(el);
    return () => observer.disconnect();
  }, [opts]);

  return { ref, isIntersecting } as const;
}

