# @moruk/logger

Centralized logging service with automatic error reporting to Monitor API. Provides structured logging with multiple levels, prefixes, and environment-based configuration.

## Installation

This package is part of the moruk monorepo and is automatically available to all apps in the workspace.

```bash
# In your app's package.json dependencies
{
  "dependencies": {
    "@moruk/logger": "1.0.0"
  }
}
```

## Usage

### Basic Logging

Use the default logger instance:

```tsx
import { logger } from "@moruk/logger";

// Different log levels
logger.debug("Detailed diagnostic information");
logger.info("General information");
logger.warn("Warning: potential issue");
logger.error("Error occurred", error);
```

### Create Child Loggers

Create loggers with prefixes for different modules:

```tsx
import { logger } from "@moruk/logger";

// Create child loggers with prefixes
const authLogger = logger.createLogger("Auth");
const apiLogger = logger.createLogger("API");

// Logs will include the prefix
authLogger.info("User logged in"); // [Auth] User logged in
apiLogger.error("API request failed", error); // [API] API request failed
```

### Custom Logger Instance

Create a custom logger with specific configuration:

```tsx
import { Logger, LogLevel } from "@moruk/logger";

const customLogger = new Logger({
  minLevel: LogLevel.WARN, // Only log warnings and errors
  enabled: true,
  prefix: "MyApp",
  reportErrors: true, // Report errors to Monitor API
});

customLogger.warn("This will be logged");
customLogger.debug("This won't be logged (below min level)");
```

### Error Reporting

Errors are automatically reported to the Monitor API:

```tsx
import { logger } from "@moruk/logger";

try {
  throw new Error("Something went wrong");
} catch (error) {
  // Automatically reports to Monitor API
  logger.error("Operation failed", error);
}
```

### Configure Logger

Adjust logger settings at runtime:

```tsx
import { logger, LogLevel } from "@moruk/logger";

// Set minimum log level
logger.setLevel(LogLevel.WARN);

// Enable/disable logging
logger.setEnabled(false);

// Enable/disable error reporting
logger.setReportErrors(true);
```

## API

### Logger Class

Main logging service class.

#### Constructor

```typescript
constructor(config?: Partial<LoggerConfig>)
```

**Config Options:**

```typescript
interface LoggerConfig {
  minLevel: LogLevel; // Minimum level to log
  enabled: boolean; // Enable/disable logging
  prefix?: string; // Log prefix
  monitorClient?: MonitorClient; // Custom monitor client
  reportErrors?: boolean; // Report errors to Monitor API
}
```

#### Methods

##### `debug(message: string, ...args: unknown[]): void`

Log debug-level messages. Only shown in development mode.

**Parameters:**

- `message: string` - Debug message
- `...args: unknown[]` - Additional data to log

##### `info(message: string, ...args: unknown[]): void`

Log informational messages.

**Parameters:**

- `message: string` - Info message
- `...args: unknown[]` - Additional data to log

##### `warn(message: string, ...args: unknown[]): void`

Log warnings.

**Parameters:**

- `message: string` - Warning message
- `...args: unknown[]` - Additional data to log

##### `error(message: string, error?: Error, ...args: unknown[]): void`

Log errors and automatically report to Monitor API.

**Parameters:**

- `message: string` - Error message
- `error?: Error` - Error object
- `...args: unknown[]` - Additional data to log

##### `createLogger(prefix: string): Logger`

Create a child logger with a prefix.

**Parameters:**

- `prefix: string` - Prefix for all logs from this logger

**Returns:**

- `Logger` - New logger instance with prefix

##### `setLevel(level: LogLevel): void`

Set the minimum log level.

**Parameters:**

- `level: LogLevel` - Minimum level to log

##### `setEnabled(enabled: boolean): void`

Enable or disable logging.

**Parameters:**

- `enabled: boolean` - Whether to enable logging

##### `setReportErrors(report: boolean): void`

Enable or disable error reporting to Monitor API.

**Parameters:**

- `report: boolean` - Whether to report errors

### LogLevel Enum

Log level enumeration:

```typescript
enum LogLevel {
  DEBUG = 0, // Detailed diagnostic information
  INFO = 1, // General informational messages
  WARN = 2, // Warning messages
  ERROR = 3, // Error messages
  NONE = 4, // Disable all logging
}
```

### Helper Functions

##### `logger: Logger`

Default logger instance ready to use.

##### `createLogger(prefix: string): Logger`

Create a new logger with a prefix.

**Parameters:**

- `prefix: string` - Logger prefix

**Returns:**

- `Logger` - New logger instance

## Examples

### Module-Specific Loggers

```tsx
// services/auth.service.ts
import { logger } from "@moruk/logger";

const authLogger = logger.createLogger("AuthService");

export class AuthService {
  async login(email: string, password: string) {
    authLogger.info("Login attempt", { email });

    try {
      const user = await api.login(email, password);
      authLogger.info("Login successful", { userId: user.id });
      return user;
    } catch (error) {
      authLogger.error("Login failed", error as Error, { email });
      throw error;
    }
  }

  async logout() {
    authLogger.info("User logged out");
  }
}
```

### Conditional Logging

```tsx
import { logger, LogLevel } from "@moruk/logger";

// Development mode: log everything
if (__DEV__) {
  logger.setLevel(LogLevel.DEBUG);
} else {
  // Production: only warnings and errors
  logger.setLevel(LogLevel.WARN);
}
```

### Custom Monitor Client

```tsx
import { Logger } from "@moruk/logger";
import { MonitorClient } from "@moruk/monitoring-client";

const customMonitor = new MonitorClient({
  apiUrl: "https://custom-monitor.example.com",
  appName: "MyCustomApp",
});

const logger = new Logger({
  prefix: "CustomApp",
  monitorClient: customMonitor,
  reportErrors: true,
});

logger.error("Custom error reporting", new Error("Test"));
```

### Error Tracking with Context

```tsx
import { logger } from "@moruk/logger";

async function processPayment(amount: number, userId: string) {
  const paymentLogger = logger.createLogger("Payment");

  try {
    paymentLogger.info("Processing payment", { amount, userId });

    // Process payment
    const result = await paymentAPI.charge(amount);

    paymentLogger.info("Payment successful", {
      amount,
      userId,
      transactionId: result.id,
    });

    return result;
  } catch (error) {
    // Error is automatically reported to Monitor API with context
    paymentLogger.error("Payment processing failed", error as Error, { amount, userId });
    throw error;
  }
}
```

### Testing Without Error Reporting

```tsx
import { Logger, LogLevel } from "@moruk/logger";

// Create logger for tests
const testLogger = new Logger({
  minLevel: LogLevel.DEBUG,
  reportErrors: false, // Don't report to Monitor API during tests
});

describe("MyService", () => {
  it("should log errors without reporting", () => {
    const spy = jest.spyOn(console, "error");

    testLogger.error("Test error", new Error("Test"));

    expect(spy).toHaveBeenCalled();
    // No Monitor API call was made
  });
});
```

## Log Output Format

Logs are formatted with:

- **Timestamp** - When the log occurred
- **Level** - Log level (DEBUG, INFO, WARN, ERROR)
- **Prefix** - Optional logger prefix
- **Message** - Log message
- **Data** - Additional data as JSON

Example output:

```
[2024-12-24T10:30:45.123Z] [INFO] [Auth] User logged in {"userId": "123"}
[2024-12-24T10:30:50.456Z] [ERROR] [API] Request failed {"url": "/api/data"} Error: Network timeout
```

## Environment Behavior

- **Development (`__DEV__ === true`)**: Default log level is DEBUG, all logs shown
- **Production (`__DEV__ === false`)**: Default log level is INFO, debug logs hidden

## Dependencies

- `@moruk/monitoring-client` - For error reporting to Monitor API
