// Thin wrapper — binds app's colorUtils to the shared hook
import { useThemedColors as _useThemedColors } from "@moruk/hooks";
import { colorUtils } from "@/config";

export const useThemedColors = () => _useThemedColors(colorUtils);
