import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

export function useNow(everyMs = 60_000) {
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), everyMs);
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active') setNow(Date.now());
    });
    return () => {
      clearInterval(t);
      sub.remove();
    };
  }, [everyMs]);
  return now;
}
