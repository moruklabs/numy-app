/**
 * @moruk/hooks
 * Shared React hooks for identifier apps
 *
 * Eliminates duplicate hook implementations across:
 * - numy
 * - pet-doctor
 * - numy
 * - stone-identifier
 * - plant-doctor
 * - insect-identifier
 */

// Types
export type { HooksConfig, ImageData, PartialHooksConfig, TranslateFunction } from "./types";

// Hooks
export { useErrorHandling } from "./useErrorHandling";
export type { UseErrorHandlingOptions, UseErrorHandlingReturn } from "./useErrorHandling";

export { useImageSelection } from "./useImageSelection";
export type { UseImageSelectionOptions, UseImageSelectionReturn } from "./useImageSelection";

export { useImageUpload } from "./useImageUpload";
export type { UseImageUploadOptions, UseImageUploadReturn } from "./useImageUpload";

export { useEraseData } from "./useEraseData";
export type { EraseDataOptions, UseEraseDataResult } from "./useEraseData";

export { useSteps } from "./useSteps";
export type { UseStepsOptions, UseStepsReturn } from "./useSteps";

export { useConsent } from "./useConsent";
export type { ConsentPreferences } from "./useConsent";
