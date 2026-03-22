import { useState, useEffect, useRef, useCallback } from "react";

export const useTimer = (initialMinutes: number, onComplete: () => void) => {
  const [totalSeconds, setTotalSeconds] = useState(initialMinutes * 60);
  const [isActive, setIsActive] = useState(false);
  const intervalRef = useRef<number | null>(null);
  const onCompleteRef = useRef(onComplete);

  // Keep onComplete ref updated to avoid stale closures
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  const start = useCallback(() => setIsActive(true), []);
  const pause = useCallback(() => setIsActive(false), []);
  const reset = useCallback(() => {
    setIsActive(false);
    setTotalSeconds(initialMinutes * 60);
  }, [initialMinutes]);

  useEffect(() => {
    setTotalSeconds(initialMinutes * 60);
  }, [initialMinutes]);

  useEffect(() => {
    if (isActive) {
      intervalRef.current = window.setInterval(() => {
        setTotalSeconds((prev) => {
          if (prev <= 1) {
            clearInterval(intervalRef.current!);
            setIsActive(false);
            onCompleteRef.current();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isActive]);

  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const progress =
    ((initialMinutes * 60 - totalSeconds) / (initialMinutes * 60)) * 100;

  return { minutes, seconds, isActive, progress, start, pause, reset };
};
