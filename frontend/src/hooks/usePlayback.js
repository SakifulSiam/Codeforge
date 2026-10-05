import { useEffect, useState } from 'react';

// Both visualizers use the same small timer. Each frame is one algorithm step.
export default function usePlayback(frames, delay) {
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const last = frames.length - 1;

  useEffect(() => {
    setIndex(0);
    setPlaying(false);
  }, [frames]);

  useEffect(() => {
    if (!playing) return;
    if (index >= last) {
      setPlaying(false);
      return;
    }
    const timer = setTimeout(() => setIndex((current) => current + 1), delay);
    return () => clearTimeout(timer);
  }, [playing, index, last, delay, frames]);

  const reset = () => {
    setPlaying(false);
    setIndex(0);
  };
  const toggle = () => {
    if (index >= last) setIndex(0);
    setPlaying((current) => !current);
  };
  const step = () => {
    setPlaying(false);
    setIndex((current) => Math.min(current + 1, last));
  };

  return { frame: frames[Math.min(index, last)], index, last, playing, toggle, step, reset };
}
