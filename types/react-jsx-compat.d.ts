// react-jsx-compat.d.ts
// Compatibility shim: React Native 0.81 + @types/react 19.x
//
// In React 19, the JSX transform checks component class structure strictly.
// React Native components use a Constructor<NativeMethods> mixin pattern
// that TypeScript cannot verify as a valid React.Component subclass.
//
// This shim bypasses the class-based check by mapping all core RN components
// through JSX.IntrinsicElements, which accepts any callable that returns
// a valid JSX element.

declare namespace JSX {
  interface IntrinsicElements {
    // Core layout
    "RCTView": any;
    "RCTText": any;
    "RCTScrollView": any;
    "RCTImage": any;
  }
  // Allow all class components to be used as JSX elements
  // This is necessary for React Native 0.81 + @types/react 19.x
  type ElementClass = {
    render(): import("react").ReactNode;
  } | {
    props: any;
  };
  // Relaxed element type constraint
  type Element = import("react").ReactElement<any, any> | null;
}
