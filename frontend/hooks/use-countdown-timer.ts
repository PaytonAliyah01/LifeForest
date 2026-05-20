import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

type UseCountdownTimerOptions = {
  initialSeconds: number;
  autoStart?: boolean;
  onComplete?: () => void;
};

type UseCountdownTimerResult = {
  remainingSeconds: number;
  isRunning: boolean;
  formattedTime: string;
  start: () => void;
  pause: () => void;
  stop: () => void;
  reset: (nextSeconds?: number) => void;
};

const formatTime = (totalSeconds: number): string => {
  const safeSeconds = Math.max(0, totalSeconds);
  const minutes = Math.floor(safeSeconds / 60);
  const seconds = safeSeconds % 60;

  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

export const useCountdownTimer = ({
  initialSeconds,
  autoStart = false,
  onComplete,
}: UseCountdownTimerOptions): UseCountdownTimerResult => {
  const sanitizedInitialSeconds = Math.max(0, Math.floor(initialSeconds));
  const [remainingSeconds, setRemainingSeconds] = useState(sanitizedInitialSeconds);
  const [isRunning, setIsRunning] = useState(autoStart && sanitizedInitialSeconds > 0);
  const completionCalledRef = useRef(false);
  const remainingSecondsRef = useRef(sanitizedInitialSeconds);

  useEffect(() => {
    remainingSecondsRef.current = remainingSeconds;
  }, [remainingSeconds]);

  useEffect(() => {
    setRemainingSeconds(sanitizedInitialSeconds);
    setIsRunning(autoStart && sanitizedInitialSeconds > 0);
    completionCalledRef.current = false;
  }, [autoStart, sanitizedInitialSeconds]);

  useEffect(() => {
    if (!isRunning || remainingSeconds <= 0) {
      if (remainingSeconds <= 0 && !completionCalledRef.current) {
        completionCalledRef.current = true;
        setIsRunning(false);
        onComplete?.();
      }

      return;
    }

    const timer = setInterval(() => {
      setRemainingSeconds((current) => {
        if (current <= 1) {
          return 0;
        }

        return current - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isRunning, onComplete, remainingSeconds]);

  const formattedTime = useMemo(() => formatTime(remainingSeconds), [remainingSeconds]);

  const start = useCallback(() => {
    if (remainingSecondsRef.current <= 0) {
      completionCalledRef.current = false;
      setRemainingSeconds(sanitizedInitialSeconds);
      setIsRunning(sanitizedInitialSeconds > 0);
      return;
    }

    setIsRunning(true);
  }, [sanitizedInitialSeconds]);

  const pause = useCallback(() => {
    setIsRunning(false);
  }, []);

  const stop = useCallback(() => {
    completionCalledRef.current = false;
    setIsRunning(false);
    setRemainingSeconds(0);
  }, []);

  const reset = useCallback((nextSeconds?: number) => {
    const resetSeconds =
      nextSeconds == null ? sanitizedInitialSeconds : Math.max(0, Math.floor(nextSeconds));

    completionCalledRef.current = false;
    setIsRunning(false);
    setRemainingSeconds(resetSeconds);
  }, [sanitizedInitialSeconds]);

  return {
    remainingSeconds,
    isRunning,
    formattedTime,
    start,
    pause,
    stop,
    reset,
  };
};
