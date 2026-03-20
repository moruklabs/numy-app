/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useEffect, useRef, useState } from "react";

// --- Animation types ---
export interface AnimationTokens {
  duration: {
    fast: number;
    normal: number;
    slow: number;
    verySlow: number;
    pageTransition: number;
  };
  delay: {
    none: number;
    short: number;
    medium: number;
    long: number;
    veryLong: number;
  };
}

export interface AnimationOptions {
  type?: string;
  duration?: number;
  delay?: number;
  [key: string]: any;
}

export interface ColorUtilsContract {
  getBackground: (isDark: boolean) => string;
  getSurface: (isDark: boolean) => string;
  getText: (isDark: boolean) => string;
  getTextMuted: (isDark: boolean) => string;
  getBorder: (isDark: boolean) => string;
}

// --- Swipe navigation ---
export interface SwipeNavigationOptions {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  threshold?: number;
  [key: string]: any;
}

export interface SwipeNavigationResult {
  gestureHandler: any;
}

export function useSwipeNavigation(_options?: SwipeNavigationOptions): SwipeNavigationResult {
  return { gestureHandler: {} };
}

// --- Haptic ---
export interface UseHapticReturn {
  trigger: (type?: string) => void;
}

export function useHaptic(): UseHapticReturn {
  return { trigger: () => {} };
}

// --- Debounce ---
export function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

// --- Reduced motion ---
export function useReducedMotion(): boolean {
  return false;
}

// --- Analytics ---
export const AnalyticsEvents = {} as Record<string, string>;

export function useAnalytics(): void {}

// --- Themed colors ---
export function useThemedColors(colorUtils: ColorUtilsContract) {
  return {
    background: colorUtils.getBackground(true),
    surface: colorUtils.getSurface(true),
    text: colorUtils.getText(true),
    textMuted: colorUtils.getTextMuted(true),
    border: colorUtils.getBorder(true),
  };
}

// --- Animation config ---
export function useAnimationConfig(_tokens: AnimationTokens, _options?: AnimationOptions) {
  return { duration: 220, delay: 0 };
}

export function useCustomAnimation(
  _tokens: AnimationTokens,
  _from: Record<string, unknown>,
  _animate: Record<string, unknown>,
  _options?: Omit<AnimationOptions, "type"> & { duration?: number }
) {
  return {};
}

// --- Erase data ---
interface EraseDataConfirmation {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  extraActions?: Array<() => Promise<void>>;
  onSuccess?: () => void;
}

export function useEraseData() {
  const showConfirmation = useCallback((_config: EraseDataConfirmation) => {}, []);
  return { showConfirmation };
}
