# @moruk/storage

Storage wrapper for React Native apps using AsyncStorage. Provides a simplified API with automatic JSON serialization/deserialization and error handling.

## Installation

This package is part of the moruk monorepo and is automatically available to all apps in the workspace.

```bash
# In your app's package.json dependencies
{
  "dependencies": {
    "@moruk/storage": "1.0.0"
  }
}
```

## Usage

### Basic Operations

Store and retrieve data with automatic JSON handling:

```tsx
import { storage } from "@moruk/storage";

// Store data (automatically serializes to JSON)
await storage.setItem("user", {
  id: "123",
  name: "John Doe",
  email: "john@example.com",
});

// Retrieve data (automatically deserializes from JSON)
const user = await storage.getItem<{ id: string; name: string; email: string }>("user");
console.log(user?.name); // "John Doe"

// Remove data
await storage.removeItem("user");

// Clear all data
await storage.clear();
```

### Type-Safe Storage

Use TypeScript generics for type safety:

```tsx
import { storage } from "@moruk/storage";

interface UserPreferences {
  theme: "light" | "dark";
  language: string;
  notifications: boolean;
}

// Store with type
await storage.setItem<UserPreferences>("preferences", {
  theme: "dark",
  language: "en",
  notifications: true,
});

// Retrieve with type
const prefs = await storage.getItem<UserPreferences>("preferences");
if (prefs) {
  console.log(prefs.theme); // Type-safe access
}
```

### Working with Multiple Items

Batch operations for efficiency:

```tsx
import { storage } from "@moruk/storage";

// Get multiple items at once
const pairs = await storage.multiGet(["user", "preferences", "session"]);
pairs.forEach(([key, value]) => {
  console.log(`${key}:`, value);
});

// Set multiple items at once
await storage.multiSet([
  ["user", { id: "123", name: "John" }],
  ["theme", "dark"],
  ["language", "en"],
]);

// Remove multiple items
await storage.multiRemove(["user", "theme", "language"]);
```

### List All Keys

Get all storage keys:

```tsx
import { storage } from "@moruk/storage";

const keys = await storage.getAllKeys();
console.log("Stored keys:", keys);
```

## API

### storage

Default storage instance with convenience methods.

#### Methods

##### `getItem<T>(key: string): Promise<T | null>`

Retrieve and deserialize a value from storage.

**Parameters:**

- `key: string` - Storage key

**Returns:**

- `Promise<T | null>` - Parsed value or null if not found

**Example:**

```tsx
const userData = await storage.getItem<User>("user");
```

##### `setItem<T>(key: string, value: T): Promise<void>`

Serialize and store a value.

**Parameters:**

- `key: string` - Storage key
- `value: T` - Value to store (will be JSON serialized)

**Example:**

```tsx
await storage.setItem("settings", { darkMode: true });
```

##### `removeItem(key: string): Promise<void>`

Remove an item from storage.

**Parameters:**

- `key: string` - Storage key

**Example:**

```tsx
await storage.removeItem("session");
```

##### `clear(): Promise<void>`

Clear all items from storage.

**Example:**

```tsx
await storage.clear();
```

##### `getAllKeys(): Promise<readonly string[]>`

Get all storage keys.

**Returns:**

- `Promise<readonly string[]>` - Array of all keys

**Example:**

```tsx
const keys = await storage.getAllKeys();
console.log("Total keys:", keys.length);
```

##### `multiGet(keys: string[]): Promise<[string, any][]>`

Get multiple items at once.

**Parameters:**

- `keys: string[]` - Array of keys to retrieve

**Returns:**

- `Promise<[string, any][]>` - Array of [key, value] pairs

**Example:**

```tsx
const pairs = await storage.multiGet(["user", "theme", "language"]);
const dataMap = Object.fromEntries(pairs);
```

##### `multiSet(keyValuePairs: [string, any][]): Promise<void>`

Set multiple items at once.

**Parameters:**

- `keyValuePairs: [string, any][]` - Array of [key, value] pairs

**Example:**

```tsx
await storage.multiSet([
  ["user", userData],
  ["theme", "dark"],
  ["lastLogin", new Date().toISOString()],
]);
```

##### `multiRemove(keys: string[]): Promise<void>`

Remove multiple items at once.

**Parameters:**

- `keys: string[]` - Array of keys to remove

**Example:**

```tsx
await storage.multiRemove(["session", "tempData", "cache"]);
```

## Examples

### User Session Management

```tsx
import { storage } from "@moruk/storage";

interface UserSession {
  userId: string;
  token: string;
  expiresAt: string;
}

class SessionManager {
  static async saveSession(session: UserSession) {
    await storage.setItem<UserSession>("session", session);
  }

  static async getSession(): Promise<UserSession | null> {
    const session = await storage.getItem<UserSession>("session");

    // Check if session expired
    if (session && new Date(session.expiresAt) < new Date()) {
      await this.clearSession();
      return null;
    }

    return session;
  }

  static async clearSession() {
    await storage.removeItem("session");
  }

  static async isLoggedIn(): Promise<boolean> {
    const session = await this.getSession();
    return session !== null;
  }
}
```

### Settings Persistence

```tsx
import { storage } from "@moruk/storage";

interface AppSettings {
  theme: "light" | "dark" | "auto";
  language: string;
  notifications: {
    enabled: boolean;
    sound: boolean;
    vibrate: boolean;
  };
  privacy: {
    analytics: boolean;
    crashReports: boolean;
  };
}

const DEFAULT_SETTINGS: AppSettings = {
  theme: "auto",
  language: "en",
  notifications: {
    enabled: true,
    sound: true,
    vibrate: true,
  },
  privacy: {
    analytics: true,
    crashReports: true,
  },
};

export class SettingsManager {
  static async getSettings(): Promise<AppSettings> {
    const settings = await storage.getItem<AppSettings>("settings");
    return settings || DEFAULT_SETTINGS;
  }

  static async updateSettings(updates: Partial<AppSettings>) {
    const current = await this.getSettings();
    const updated = { ...current, ...updates };
    await storage.setItem("settings", updated);
    return updated;
  }

  static async resetSettings() {
    await storage.setItem("settings", DEFAULT_SETTINGS);
    return DEFAULT_SETTINGS;
  }
}
```

### Cache with Expiration

```tsx
import { storage } from "@moruk/storage";

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresIn: number; // milliseconds
}

export class CacheManager {
  static async set<T>(
    key: string,
    data: T,
    expiresIn: number = 3600000 // 1 hour default
  ) {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      expiresIn,
    };
    await storage.setItem(`cache_${key}`, entry);
  }

  static async get<T>(key: string): Promise<T | null> {
    const entry = await storage.getItem<CacheEntry<T>>(`cache_${key}`);

    if (!entry) {
      return null;
    }

    // Check if expired
    const age = Date.now() - entry.timestamp;
    if (age > entry.expiresIn) {
      await storage.removeItem(`cache_${key}`);
      return null;
    }

    return entry.data;
  }

  static async clearCache() {
    const keys = await storage.getAllKeys();
    const cacheKeys = keys.filter((k) => k.startsWith("cache_"));
    await storage.multiRemove(cacheKeys as string[]);
  }
}
```

### Migration Helper

```tsx
import { storage } from "@moruk/storage";

interface Migration {
  version: number;
  migrate: () => Promise<void>;
}

const migrations: Migration[] = [
  {
    version: 1,
    migrate: async () => {
      // Migrate old user format to new format
      const oldUser = await storage.getItem<any>("user");
      if (oldUser && !oldUser.version) {
        await storage.setItem("user", {
          ...oldUser,
          version: 1,
          createdAt: new Date().toISOString(),
        });
      }
    },
  },
  {
    version: 2,
    migrate: async () => {
      // Split settings into separate keys
      const settings = await storage.getItem<any>("settings");
      if (settings) {
        await storage.multiSet([
          ["theme", settings.theme],
          ["language", settings.language],
          ["notifications", settings.notifications],
        ]);
      }
    },
  },
];

export async function runMigrations() {
  let currentVersion = (await storage.getItem<number>("schemaVersion")) || 0;

  for (const migration of migrations) {
    if (migration.version > currentVersion) {
      console.log(`Running migration ${migration.version}`);
      await migration.migrate();
      currentVersion = migration.version;
    }
  }

  await storage.setItem("schemaVersion", currentVersion);
}
```

### Debug Storage

```tsx
import { storage } from "@moruk/storage";

export async function debugStorage() {
  const keys = await storage.getAllKeys();
  console.log(`Total keys: ${keys.length}`);

  const pairs = await storage.multiGet(keys as string[]);
  pairs.forEach(([key, value]) => {
    const size = JSON.stringify(value).length;
    console.log(`${key}: ${size} bytes`, value);
  });
}
```

## Error Handling

All methods include built-in error handling. Errors are logged to console but don't throw, making the API safe to use without try-catch:

```tsx
import { storage } from "@moruk/storage";

// Safe to use without try-catch
const user = await storage.getItem("user"); // Returns null on error
await storage.setItem("key", value); // Logs error but doesn't throw
```

For critical operations where you need to know about failures:

```tsx
import AsyncStorage from "@react-native-async-storage/async-storage";

try {
  await AsyncStorage.setItem("critical-data", JSON.stringify(data));
} catch (error) {
  console.error("Failed to save critical data:", error);
  // Handle the error appropriately
}
```

## Performance Tips

1. **Use multiGet/multiSet for batch operations** - More efficient than multiple single operations
2. **Avoid storing large objects** - AsyncStorage has size limits
3. **Use appropriate keys** - Namespaced keys (e.g., `user:123:profile`) for organization
4. **Clean up expired data** - Regularly remove old cache entries

## Storage Limits

- **iOS**: Unlimited (stored in Documents directory)
- **Android**: 6 MB default limit (can be increased)
- **Web**: ~5-10 MB depending on browser

For large data, consider alternative solutions like SQLite or file system storage.

## Dependencies

- `@react-native-async-storage/async-storage` - Core storage implementation
- `react` - React library
- `react-native` - React Native framework

## Default Export

The package exports a default `storage` instance:

```tsx
import storage from "@moruk/storage";

// Same as named export
import { storage } from "@moruk/storage";
```
