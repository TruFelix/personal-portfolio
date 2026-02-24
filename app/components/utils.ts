import { useLayoutEffect, useState } from "react";

export const isMobile = (window: Window) => window.matchMedia("(max-width: 600px)").matches;

export function useWindowSize(initialValue = { width: 0, height: 0 }) {
  const [size, setSize] = useState<{ width: number, height: number }>(initialValue);

  useLayoutEffect(() => {
    function updateSize() {
      setSize({ width: window.innerWidth, height: window.innerHeight });
    }

    window.addEventListener('resize', updateSize);

    updateSize();

    return () => window.removeEventListener('resize', updateSize);
  }, []);

  return size;
}