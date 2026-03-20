// react-native-compat.d.ts
// React Native 0.81 + @types/react 19.x compatibility patch.
// RN's ViewBase, TextBase etc. are declared as Constructor<NativeMethods> & typeof React.Component
// which TypeScript 5.x with strict React 19 cannot use as JSX elements.
// This override re-declares them as React.ComponentType which is JSX-compatible.

import type { ComponentType, FC, PropsWithChildren, ReactNode } from "react";
import type {
  ViewProps, TextProps, ScrollViewProps, ImageProps,
  TouchableOpacityProps, TouchableHighlightProps,
  TouchableWithoutFeedbackProps, PressableProps, ModalProps,
  KeyboardAvoidingViewProps, FlatListProps, SectionListProps,
  SwitchProps, TextInputProps, ActivityIndicatorProps,
  SafeAreaViewProps,
} from "react-native";

// Re-export these types so module augmentation works
declare module "react-native" {
  // Patch ViewProps to include children (React 19 no longer infers it)
  interface ViewProps {
    children?: ReactNode | ReactNode[];
  }
  interface TextProps {
    children?: ReactNode | ReactNode[];
  }
  interface ScrollViewProps {
    children?: ReactNode | ReactNode[];
  }
  interface SafeAreaViewProps {
    children?: ReactNode | ReactNode[];
  }
  interface KeyboardAvoidingViewProps {
    children?: ReactNode | ReactNode[];
  }
  interface ModalProps {
    children?: ReactNode | ReactNode[];
  }
  interface TouchableOpacityProps {
    children?: ReactNode | ReactNode[];
  }
  interface TouchableHighlightProps {
    children?: ReactNode | ReactNode[];
  }
}
