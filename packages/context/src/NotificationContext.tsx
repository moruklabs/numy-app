import React, { createContext, useCallback, useContext, useState } from "react";
// Import directly to avoid require cycle with @moruk/ui barrel export
import { NotificationBanner, NotificationType } from "@moruk/ui/src/components/NotificationBanner";

interface NotificationOptions {
  type: NotificationType;
  message: string;
  action?: {
    label: string;
    onPress: () => void;
  };
  autoHideDuration?: number;
}

interface NotificationContextType {
  showNotification: (options: NotificationOptions) => void;
  hideNotification: () => void;
}

const NotificationContext = createContext<NotificationContextType>({
  showNotification: () => {},
  hideNotification: () => {},
});

export const useNotification = () => useContext(NotificationContext);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notification, setNotification] = useState<NotificationOptions | null>(null);

  const showNotification = useCallback((options: NotificationOptions) => {
    setNotification(options);
  }, []);

  const hideNotification = useCallback(() => {
    setNotification(null);
  }, []);

  return (
    <NotificationContext.Provider value={{ showNotification, hideNotification }}>
      {children}
      {notification && <NotificationBanner {...notification} onDismiss={hideNotification} />}
    </NotificationContext.Provider>
  );
};
