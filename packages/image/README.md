# @moruk/image

Image service utilities for picking, capturing, and processing images in React Native apps. Provides a unified interface for camera, photo library, and image manipulation.

## Installation

This package is part of the moruk monorepo and is automatically available to all apps in the workspace.

```bash
# In your app's package.json dependencies
{
  "dependencies": {
    "@moruk/image": "1.0.0"
  }
}
```

## Usage

### Pick Image from Library

Allow users to select an image from their photo library:

```tsx
import { ImageService } from "@moruk/image";

const pickImage = async () => {
  try {
    const result = await ImageService.pickImage({
      allowsMultipleSelection: false,
      quality: 0.8,
    });

    if (result) {
      console.log("Image URI:", result.uri);
      console.log("Base64:", result.base64);
    }
  } catch (error) {
    console.error("Failed to pick image:", error);
  }
};
```

### Take Photo with Camera

Capture a photo using the device camera:

```tsx
import { ImageService } from "@moruk/image";

const takePhoto = async () => {
  try {
    const result = await ImageService.takePicture({
      quality: 0.9,
      allowsEditing: true,
    });

    if (result) {
      console.log("Photo URI:", result.uri);
    }
  } catch (error) {
    console.error("Failed to take photo:", error);
  }
};
```

### Compress Image

Reduce image file size:

```tsx
import { ImageService } from "@moruk/image";

const compressedImage = await ImageService.compressImage(imageUri, {
  quality: 0.7,
  maxWidth: 1024,
  maxHeight: 1024,
});

console.log("Original size:", originalSize);
console.log("Compressed size:", compressedImage.size);
```

### Convert to Base64

Get base64 representation of an image:

```tsx
import { ImageService } from "@moruk/image";

const base64 = await ImageService.getBase64(imageUri);
console.log("Base64:", base64.substring(0, 50) + "...");
```

## API

### ImageService

Static service class for image operations.

#### Methods

##### `pickImage(options?: ImagePickerOptions): Promise<ProcessedImageData | null>`

Open the photo library to select an image.

**Parameters:**

- `options?: ImagePickerOptions` - Picker configuration

**Returns:**

- `ProcessedImageData | null` - Selected image data or null if cancelled

**Example:**

```tsx
const image = await ImageService.pickImage({
  allowsMultipleSelection: false,
  quality: 0.8,
  allowsEditing: true,
});
```

##### `takePicture(options?: CameraOptions): Promise<ProcessedImageData | null>`

Open the camera to take a photo.

**Parameters:**

- `options?: CameraOptions` - Camera configuration

**Returns:**

- `ProcessedImageData | null` - Captured image data or null if cancelled

**Example:**

```tsx
const photo = await ImageService.takePicture({
  quality: 0.9,
  allowsEditing: false,
});
```

##### `compressImage(uri: string, options?: CompressionOptions): Promise<ImageData>`

Compress an image to reduce file size.

**Parameters:**

- `uri: string` - Image URI to compress
- `options?: CompressionOptions` - Compression settings

**Returns:**

- `ImageData` - Compressed image data

**Example:**

```tsx
const compressed = await ImageService.compressImage(imageUri, {
  quality: 0.7,
  maxWidth: 1920,
  maxHeight: 1080,
});
```

##### `getBase64(uri: string): Promise<string>`

Convert an image to base64 encoding.

**Parameters:**

- `uri: string` - Image URI

**Returns:**

- `Promise<string>` - Base64-encoded image data

**Example:**

```tsx
const base64 = await ImageService.getBase64(imageUri);
```

## Types

### ProcessedImageData

Processed image data returned from pick/capture operations:

```typescript
interface ProcessedImageData {
  uri: string; // Local file URI
  base64?: string; // Base64-encoded data
  width: number; // Image width in pixels
  height: number; // Image height in pixels
  size?: number; // File size in bytes
  mimeType?: string; // MIME type (e.g., "image/jpeg")
}
```

### ImageData

Basic image data:

```typescript
interface ImageData {
  uri: string; // Local file URI
  base64: string; // Base64-encoded data
  width: number; // Image width in pixels
  height: number; // Image height in pixels
  size?: number; // File size in bytes
  mimeType?: string; // MIME type
}
```

### ImagePickerOptions

Options for picking images from library:

```typescript
interface ImagePickerOptions {
  allowsMultipleSelection?: boolean; // Allow selecting multiple images
  quality?: number; // 0.0 to 1.0
  allowsEditing?: boolean; // Allow cropping/editing
  aspect?: [number, number]; // Aspect ratio for editing
  base64?: boolean; // Include base64 data
}
```

### CameraOptions

Options for camera capture:

```typescript
interface CameraOptions {
  quality?: number; // 0.0 to 1.0
  allowsEditing?: boolean; // Allow cropping/editing
  aspect?: [number, number]; // Aspect ratio for editing
  base64?: boolean; // Include base64 data
}
```

### CompressionOptions

Options for image compression:

```typescript
interface CompressionOptions {
  quality?: number; // 0.0 to 1.0 (default: 0.8)
  maxWidth?: number; // Max width in pixels
  maxHeight?: number; // Max height in pixels
  format?: "jpeg" | "png"; // Output format (default: "jpeg")
}
```

## Error Handling

The service throws specific error types for different failure scenarios:

### ImageServiceError

Generic image service error:

```typescript
class ImageServiceError extends Error {
  code: string;
  originalError?: Error;
}
```

### AnalysisError

Error during image analysis:

```typescript
class AnalysisError extends ImageServiceError {
  // Inherits from ImageServiceError
}
```

**Example:**

```tsx
import { ImageService, ImageServiceError, AnalysisError } from "@moruk/image";

try {
  const image = await ImageService.pickImage();
} catch (error) {
  if (error instanceof AnalysisError) {
    console.error("Analysis failed:", error.message);
  } else if (error instanceof ImageServiceError) {
    console.error("Image service error:", error.code);
  } else {
    console.error("Unknown error:", error);
  }
}
```

## Permissions

The service automatically requests necessary permissions:

- **Camera** - Required for `takePicture()`
- **Photo Library** - Required for `pickImage()`

Permissions are requested when the respective methods are called.

## Example: Complete Image Picker

```tsx
import React, { useState } from "react";
import { View, Button, Image, Text } from "react-native";
import { ImageService, ImageServiceError } from "@moruk/image";
import type { ProcessedImageData } from "@moruk/image";

export function ImagePickerScreen() {
  const [image, setImage] = useState<ProcessedImageData | null>(null);
  const [error, setError] = useState<string>("");

  const handlePickImage = async () => {
    try {
      setError("");
      const result = await ImageService.pickImage({
        allowsEditing: true,
        quality: 0.8,
        aspect: [4, 3],
      });

      if (result) {
        setImage(result);
      }
    } catch (err) {
      const error = err as ImageServiceError;
      setError(error.message);
    }
  };

  const handleTakePhoto = async () => {
    try {
      setError("");
      const result = await ImageService.takePicture({
        quality: 0.9,
        allowsEditing: true,
      });

      if (result) {
        setImage(result);

        // Optionally compress
        const compressed = await ImageService.compressImage(result.uri, {
          quality: 0.7,
          maxWidth: 1024,
          maxHeight: 1024,
        });

        console.log("Compressed size:", compressed.size);
      }
    } catch (err) {
      const error = err as ImageServiceError;
      setError(error.message);
    }
  };

  return (
    <View style={{ flex: 1, padding: 20 }}>
      <Button title="Pick from Library" onPress={handlePickImage} />
      <Button title="Take Photo" onPress={handleTakePhoto} />

      {error && <Text style={{ color: "red" }}>{error}</Text>}

      {image && (
        <View>
          <Image source={{ uri: image.uri }} style={{ width: 300, height: 300 }} />
          <Text>
            Size: {image.width}x{image.height}
          </Text>
          {image.size && <Text>File size: {(image.size / 1024).toFixed(2)} KB</Text>}
        </View>
      )}
    </View>
  );
}
```

## Dependencies

- `expo` - Expo framework
- `expo-file-system` - File system operations
- `expo-image-manipulator` - Image manipulation
- `expo-image-picker` - Image picking and camera
- `react-native` - React Native framework
