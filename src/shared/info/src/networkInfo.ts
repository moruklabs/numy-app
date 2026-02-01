import * as Network from "expo-network";
import { logger } from "@moruk/logger";

export interface NetworkInfo {
  isConnected: boolean;
  type: Network.NetworkStateType | "unknown";
  isInternetReachable: boolean | null;
}

export const getNetworkInfo = async (): Promise<NetworkInfo> => {
  try {
    const netInfo = await Network.getNetworkStateAsync();

    return {
      isConnected: netInfo.isConnected ?? true,
      type: netInfo.type || "unknown",
      isInternetReachable: netInfo.isInternetReachable ?? null,
    };
  } catch (error) {
    logger.warn("Error getting network info:", error);
    return {
      isConnected: true, // Assume connected if we can't check
      type: "unknown",
      isInternetReachable: null,
    };
  }
};
