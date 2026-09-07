'use client';
import { useSyncExternalStore } from 'react';

let stage = 0;
const listeners = new Set<() => void>();
export function setNarrativeStage(next: number) {
  stage = Math.max(0, Math.min(6, next));
  listeners.forEach((listener) => listener());
}
const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};
export function useNarrativeStage() {
  return useSyncExternalStore(
    subscribe,
    () => stage,
    () => 0,
  );
}
