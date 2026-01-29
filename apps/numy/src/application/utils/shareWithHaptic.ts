/**
 * Share with Haptic Feedback Utility
 *
 * Combines haptic feedback with share functionality for consistent UX.
 * Used throughout the app when sharing content.
 */

import * as Haptics from "expo-haptics";
import { Share, ShareContent, ShareOptions } from "react-native";

/**
 * Triggers haptic feedback and then shares content.
 * Provides consistent haptic-then-share pattern across the app.
 *
 * @param content - The content to share (message, url, title)
 * @param options - Optional share dialog options
 * @param hapticStyle - The haptic feedback style (default: Light)
 * @returns Promise that resolves when share dialog is dismissed
 *
 * @example
 * ```tsx
 * await shareWithHaptic({ message: "Result: 42" });
 *
 * // With custom haptic
 * await shareWithHaptic(
 *   { message: "Important result" },
 *   {},
 *   Haptics.ImpactFeedbackStyle.Medium
 * );
 * ```
 */
export async function shareWithHaptic(
  content: ShareContent,
  options?: ShareOptions,
  hapticStyle: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light
): Promise<void> {
  await Haptics.impactAsync(hapticStyle);
  await Share.share(content, options);
}
