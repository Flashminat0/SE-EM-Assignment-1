import NetInfo from '@react-native-community/netinfo';
import { useEffect, useState } from 'react';
import { emulatorHost, usingEmulators } from './firebase';

if (usingEmulators) {
  NetInfo.configure({
    reachabilityUrl: `http://${emulatorHost}:9099/`,
    reachabilityMethod: 'GET',
    reachabilityTest: (r) => Promise.resolve(r.status === 200),
    useNativeReachability: false,
    reachabilityShortTimeout: 2_000,
    reachabilityLongTimeout: 4_000,
    reachabilityRequestTimeout: 1_500,
  });
}

let online = true;
const subs = new Set<(v: boolean) => void>();
NetInfo.addEventListener((s) => {
  const next = !!s.isConnected && s.isInternetReachable !== false;
  if (next !== online) {
    online = next;
    subs.forEach((f) => f(next));
  }
});

export const isOnline = () => online;
export function onOnline(fn: () => void) {
  const h = (v: boolean) => {
    if (v) fn();
  };
  subs.add(h);
  return () => {
    subs.delete(h);
  };
}
export function useOnline() {
  const [v, setV] = useState(online);
  useEffect(() => {
    subs.add(setV);
    return () => {
      subs.delete(setV);
    };
  }, []);
  return v;
}
