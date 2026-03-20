// react-native-compat.d.ts
// Compatibility shim for React Native 0.81 + @types/react 19.x
// React 19 requires JSX components to have render/context/setState etc.
// React Native class components pre-date this and are missing these.
// This shim overrides the IntrinsicElements namespace to accept RN components.

import type { ReactNode } from "react";

declare global {
  namespace JSX {
    interface IntrinsicAttributes {
      children?: ReactNode;
    }
  }
}

declare module "react-native" {
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
  interface FlatListProps<T> {
    children?: ReactNode | ReactNode[];
  }
}

export {};
