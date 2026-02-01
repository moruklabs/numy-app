# @moruk/monitoring-client

Error reporting client for the Monitor API. Sends error reports to centralized logging with Telegram notifications for critical issues.

## Installation

This package is part of the moruk monorepo and is automatically available to all apps in the workspace.

```bash
# In your app's package.json dependencies
{
  "dependencies": {
    "@moruk/monitoring-client": "1.0.0"
  }
}
```

## Usage

### Basic Error Reporting

Use the default client instance:

```tsx
import { monitorClient } from "@moruk/monitoring-client";

try {
  throw new Error("Something went wrong");
} catch (error) {
  await monitorClient.reportError({
    error: error as Error,
    context: "PaymentScreen",
    severity: "high",
  });
}
```

### Custom Client Instance

Create a custom client with specific configuration:

```tsx
import { MonitorClient } from "@moruk/monitoring-client";

const client = new MonitorClient({
  apiUrl: "https://monitor-api.moruk.workers.dev",
  appName: "MyCustomApp",
  enabled: true,
  debug: false,
});

await client.reportError({
  error: new Error("Test error"),
  context: "TestComponent",
});
```

### Report with Additional Metadata

Include user info, device info, and custom metadata:

```tsx
import { monitorClient } from "@moruk/monitoring-client";

await monitorClient.reportError({
  error: new Error("Network timeout"),
  context: "API Request",
  severity: "medium",
  userId: "user-123",
  metadata: {
    endpoint: "/api/users",
    method: "GET",
    statusCode: 504,
    retryCount: 3,
  },
});
```

### Check Health

Verify the Monitor API is available:

```tsx
import { monitorClient } from "@moruk/monitoring-client";

const isHealthy = await monitorClient.checkHealth();
console.log("Monitor API healthy:", isHealthy);
```

## API

### MonitorClient

Client for reporting errors to the Monitor API.

#### Constructor

```typescript
constructor(config?: MonitorClientConfig)
```

**Config Options:**

```typescript
interface MonitorClientConfig {
  apiUrl?: string; // Monitor API URL (default: https://monitor-api.moruk.workers.dev)
  appName?: string; // Application name
  enabled?: boolean; // Enable/disable reporting (default: true)
  debug?: boolean; // Enable debug logging (default: false)
}
```

#### Methods

##### `reportError(options: ReportErrorOptions): Promise<MonitorResponse>`

Report an error to the Monitor API.

**Parameters:**

```typescript
interface ReportErrorOptions {
  error: Error; // Error object to report
  context?: string; // Context (e.g., component, screen)
  severity?: "low" | "medium" | "high" | "critical"; // Error severity
  userId?: string; // User identifier
  metadata?: Record<string, any>; // Additional metadata
}
```

**Returns:**

```typescript
interface MonitorResponse {
  success: boolean;
  message?: string;
  timestamp: string;
}
```

**Example:**

```tsx
const response = await monitorClient.reportError({
  error: new Error("Payment failed"),
  context: "CheckoutScreen",
  severity: "high",
  userId: "user-456",
  metadata: {
    amount: 99.99,
    currency: "USD",
    paymentMethod: "card",
  },
});

console.log("Report sent:", response.success);
```

##### `checkHealth(): Promise<boolean>`

Check if the Monitor API is available and healthy.

**Returns:**

- `Promise<boolean>` - True if API is healthy, false otherwise

**Example:**

```tsx
const isHealthy = await monitorClient.checkHealth();
if (!isHealthy) {
  console.warn("Monitor API is unavailable");
}
```

##### `setEnabled(enabled: boolean): void`

Enable or disable error reporting.

**Parameters:**

- `enabled: boolean` - Whether to enable reporting

**Example:**

```tsx
// Disable in development
if (__DEV__) {
  monitorClient.setEnabled(false);
}
```

## Types

### MonitorClientConfig

Configuration for the monitor client:

```typescript
interface MonitorClientConfig {
  apiUrl?: string; // API endpoint URL
  appName?: string; // Application name
  enabled?: boolean; // Enable/disable reporting
  debug?: boolean; // Debug mode
}
```

### ReportErrorOptions

Options for reporting an error:

```typescript
interface ReportErrorOptions {
  error: Error; // Error to report
  context?: string; // Error context
  severity?: "low" | "medium" | "high" | "critical"; // Severity level
  userId?: string; // User ID
  metadata?: Record<string, any>; // Custom metadata
}
```

### MonitorErrorReport

Complete error report payload:

```typescript
interface MonitorErrorReport {
  appName: string; // Application name
  platform: string; // Platform (ios, android, web)
  appVersion: string; // App version
  content: MonitorErrorContent;
}
```

### MonitorErrorContent

Error content details:

```typescript
interface MonitorErrorContent {
  error: {
    name: string; // Error name
    message: string; // Error message
    stack?: string; // Stack trace
  };
  context?: string; // Error context
  severity: "low" | "medium" | "high" | "critical";
  timestamp: string; // ISO 8601 timestamp
  userId?: string; // User identifier
  deviceInfo: {
    platform: string;
    version: string;
  };
  metadata?: Record<string, any>; // Additional data
}
```

### MonitorResponse

API response:

```typescript
interface MonitorResponse {
  success: boolean;
  message?: string;
  timestamp: string;
}
```

## Examples

### Global Error Handler

```tsx
import { monitorClient } from "@moruk/monitoring-client";

// Set up global error handler
ErrorUtils.setGlobalHandler(async (error, isFatal) => {
  await monitorClient.reportError({
    error,
    context: "Global Error Handler",
    severity: isFatal ? "critical" : "high",
    metadata: {
      isFatal,
    },
  });

  if (isFatal) {
    // Handle fatal errors
    Alert.alert(
      "Unexpected Error",
      "The app encountered an unexpected error and needs to restart."
    );
  }
});
```

### React Error Boundary

```tsx
import React, { Component, ErrorInfo } from "react";
import { monitorClient } from "@moruk/monitoring-client";

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  async componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    await monitorClient.reportError({
      error,
      context: "ErrorBoundary",
      severity: "high",
      metadata: {
        componentStack: errorInfo.componentStack,
      },
    });
  }

  render() {
    if (this.state.hasError) {
      return <ErrorScreen />;
    }

    return this.props.children;
  }
}
```

### Network Error Tracking

```tsx
import { monitorClient } from "@moruk/monitoring-client";

async function fetchData(url: string) {
  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    await monitorClient.reportError({
      error: error as Error,
      context: "API Request",
      severity: "medium",
      metadata: {
        url,
        timestamp: new Date().toISOString(),
      },
    });

    throw error;
  }
}
```

### Contextual Error Reporting

```tsx
import { monitorClient } from "@moruk/monitoring-client";

class PaymentService {
  async processPayment(amount: number, userId: string) {
    try {
      const result = await this.chargeCard(amount);
      return result;
    } catch (error) {
      // Report with full context
      await monitorClient.reportError({
        error: error as Error,
        context: "PaymentService.processPayment",
        severity: "critical", // Payment failures are critical
        userId,
        metadata: {
          amount,
          currency: "USD",
          timestamp: new Date().toISOString(),
          method: "card",
        },
      });

      throw error;
    }
  }
}
```

### Conditional Reporting

```tsx
import { monitorClient } from "@moruk/monitoring-client";

// Only report in production
if (!__DEV__) {
  monitorClient.setEnabled(true);

  // Report startup
  monitorClient.reportError({
    error: new Error("App started"),
    context: "App Lifecycle",
    severity: "low",
    metadata: {
      event: "startup",
      timestamp: new Date().toISOString(),
    },
  });
} else {
  monitorClient.setEnabled(false);
}
```

## Monitor API Endpoint

The client connects to the Monitor API worker:

- **URL:** `https://monitor-api.moruk.workers.dev`
- **Endpoint:** `POST /error`
- **Documentation:** See `workers/monitor-api/docs/` in the monorepo

## Error Severity Levels

- **low** - Minor issues, debugging information
- **medium** - Recoverable errors that don't affect core functionality
- **high** - Serious errors that affect functionality
- **critical** - Fatal errors, crashes, payment failures, data loss

Critical and high severity errors trigger Telegram notifications.

## Dependencies

- `expo` - Expo framework
- `expo-application` - Application information
- `expo-constants` - Device constants
- `react-native` - React Native framework
