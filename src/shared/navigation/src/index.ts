import { router } from "expo-router";
import { logger } from "@moruk/logger";

/**
 * Common navigation parameters for the monorepo apps.
 */
export interface NavigationParams {
  home: undefined;
  details: {
    imageUris?: string[];
    response?: any;
  };
  settings: undefined;
}

/**
 * Check if expo-router is ready for navigation
 */
function isRouterReady(): boolean {
  try {
    // Check if router exists and has the navigate function
    return router && typeof router.push === "function";
  } catch {
    return false;
  }
}

/**
 * Safe navigation wrapper that retries if router isn't ready
 */
function safeNavigate(action: () => void, retries = 3, delay = 100): void {
  if (isRouterReady()) {
    try {
      action();
    } catch (error) {
      if (retries > 0) {
        setTimeout(() => safeNavigate(action, retries - 1, delay), delay);
      } else {
        logger.error("Navigation", "Navigation failed after retries", error);
      }
    }
  } else if (retries > 0) {
    setTimeout(() => safeNavigate(action, retries - 1, delay), delay);
  } else {
    logger.error("Navigation", "Router not ready after retries");
  }
}

/**
 * Service to handle navigation logic using expo-router.
 */
export class NavigationService {
  /**
   * Navigate to Home screen
   */
  static navigateToHome(): void {
    safeNavigate(() => router.replace("/"));
  }

  /**
   * Navigate to Details screen with analysis results
   */
  static navigateToDetails(params: NavigationParams["details"]): void {
    // Pass all params directly, including response as an object
    const { imageUris, response } = params;
    const navParams: Record<string, any> = {};
    if (imageUris) navParams.imageUris = JSON.stringify(imageUris);
    if (response) navParams.response = JSON.stringify(response);

    safeNavigate(() => router.push({ pathname: "/details" as any, params: navParams }));
  }

  /**
   * Navigate to Settings screen
   */
  static navigateToSettings(): void {
    safeNavigate(() => router.push("/settings" as any));
  }

  /**
   * Go back to previous screen
   */
  static goBack(): void {
    safeNavigate(() => {
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace("/");
      }
    });
  }

  /**
   * Check if we can go back
   */
  static canGoBack(): boolean {
    try {
      return isRouterReady() && router.canGoBack();
    } catch {
      return false;
    }
  }
}

export default NavigationService;
