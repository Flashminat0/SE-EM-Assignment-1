import NetInfo, { type NetInfoState } from '@react-native-community/netinfo';
import { useEffect, useState } from 'react';
import { emulatorHost, usingEmulators } from '@/lib/auth/firebase';

// Against the emulators "online" means they answer, so freezing them is a real offline test
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
const apply = (s: NetInfoState) => {
  // isInternetReachable lags up to a minute after Wi-Fi returns, so go by the link only
  const next = !!s.isConnected;

  if (next !== online) {
    online = next;
    subs.forEach((f) => f(next));
  }
  return next;
};
NetInfo.addEventListener(apply);

// The Offline pill asks again instead of waiting for the next event
export const recheck = async () => apply(await NetInfo.fetch());

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
