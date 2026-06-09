import { useEffect, useState } from 'react';

export function useDemoCountdown(enabled: boolean) {
  const [minutesUntilReset, setMinutesUntilReset] = useState(0);
  const [secondsUntilReset, setSecondsUntilReset] = useState(0);

  useEffect(() => {
    if (!enabled) return;

    const update = () => {
      const now = new Date();
      setMinutesUntilReset(59 - now.getMinutes());
      setSecondsUntilReset(59 - now.getSeconds());
    };

    update();
    const intervalId = setInterval(update, 1000);
    return () => clearInterval(intervalId);
  }, [enabled]);

  return { minutesUntilReset, secondsUntilReset };
}
