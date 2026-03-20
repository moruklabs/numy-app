// Thin wrapper — binds app's ANIMATION_CONFIG to the shared hook
import {
  useAnimationConfig as _useAnimationConfig,
  useCustomAnimation as _useCustomAnimation,
} from "@moruk/hooks";
import type { AnimationOptions, AnimationTokens } from "@moruk/hooks";
import { ANIMATION_CONFIG } from "@/config";

export const useAnimationConfig = (options?: AnimationOptions) =>
  _useAnimationConfig(ANIMATION_CONFIG as AnimationTokens, options);

export const useCustomAnimation = (
  from: Record<string, unknown>,
  animate: Record<string, unknown>,
  options?: Omit<AnimationOptions, "type"> & { duration?: number }
) => _useCustomAnimation(ANIMATION_CONFIG as AnimationTokens, from, animate, options);
