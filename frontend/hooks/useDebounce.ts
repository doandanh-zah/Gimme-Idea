import { useEffect, useRef, useCallback } from 'react';

/**
 * Hook that debounces a callback function
 * Useful for preventing rapid cascades of function calls (e.g., on tab focus)
 * 
 * @param callback - The function to debounce
 * @param delay - Delay in milliseconds (default: 300ms)
 * @returns Debounced callback function
 */
export function useDebouncedCallback<T extends (...args: any[]) => any>(
    callback: T,
    delay: number = 300
): T {
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    const lastCallRef = useRef<number>(0);

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    return useCallback(
        ((...args: any[]) => {
            const now = Date.now();

            // Clear previous timeout
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }

            // Set new timeout
            timeoutRef.current = setTimeout(() => {
                lastCallRef.current = now;
                callback(...args);
            }, delay);
        }) as T,
        [callback, delay]
    );
}

/**
 * Hook that prevents rapid consecutive calls (throttle with leading edge)
 * Better for event handlers that should fire immediately but not too frequently
 * 
 * @param callback - The function to throttle
 * @param delay - Minimum delay between calls in milliseconds (default: 300ms)
 * @returns Throttled callback function
 */
export function useThrottledCallback<T extends (...args: any[]) => any>(
    callback: T,
    delay: number = 300
): T {
    const lastCallRef = useRef<number>(0);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    return useCallback(
        ((...args: any[]) => {
            const now = Date.now();
            const timeSinceLastCall = now - lastCallRef.current;

            if (timeSinceLastCall >= delay) {
                // Enough time has passed, call immediately
                lastCallRef.current = now;
                callback(...args);
            } else {
                // Not enough time, schedule for later
                if (timeoutRef.current) {
                    clearTimeout(timeoutRef.current);
                }
                timeoutRef.current = setTimeout(() => {
                    lastCallRef.current = Date.now();
                    callback(...args);
                }, delay - timeSinceLastCall);
            }
        }) as T,
        [callback, delay]
    );
}
