import './components/GooeyToast.css'

export { default as GooeyToaster } from './components/GooeyToaster.svelte'
export { gooeyToast } from './gooey-toast.js'
export { animationPresets } from './presets.js'
export type { AnimationPreset, AnimationPresetName } from './presets.js'
export type {
  GooeyToastOptions,
  GooeyPromiseData,
  GooeyToasterProps,
  GooeyToastAction,
  GooeyToastClassNames,
  GooeyToastTimings,
  GooeyToastUpdateOptions,
  GooeyToastContent,
  GooeyToastProps,
  GooeyToastPhase,
  GooeyToastType,
  DismissFilter,
} from './types.js'

// Backward-compatible aliases for v0.2.x users upgrading to v0.3.0
export { default as GoeyToaster } from './components/GooeyToaster.svelte'
export { gooeyToast as goeyToast } from './gooey-toast.js'
export type { GooeyPromiseData as GoeyPromiseData } from './types.js'
export type { GooeyToastClassNames as GoeyToastClassNames } from './types.js'
export type { GooeyToastTimings as GoeyToastTimings } from './types.js'
export type { GooeyToastOptions as GoeyToastOptions } from './types.js'
export type { GooeyToasterProps as GoeyToasterProps } from './types.js'
