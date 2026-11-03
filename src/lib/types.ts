import type { Component, Snippet } from 'svelte'
import type { ExternalToast, ToasterProps } from 'svelte-sonner'
import type { AnimationPresetName } from './presets.js'

export type GooeyToastType = 'default' | 'success' | 'error' | 'warning' | 'info'

export type GooeyToastContent = string | Snippet | Component

export interface GooeyToastTimings {
  displayDuration?: number
}

export interface GooeyToastClassNames {
  wrapper?: string
  content?: string
  header?: string
  title?: string
  icon?: string
  description?: string
  actionWrapper?: string
  actionButton?: string
}

export interface GooeyToastAction {
  label: string
  onClick: () => void
  successLabel?: string
}

export interface GooeyToastData {
  title: string
  description?: GooeyToastContent
  type: GooeyToastType
  action?: GooeyToastAction
  icon?: GooeyToastContent | null
  duration?: number
  classNames?: GooeyToastClassNames
  fillColor?: string
  borderColor?: string
  borderWidth?: number
  preset?: AnimationPresetName
  spring?: boolean
  bounce?: number
  showTimestamp?: boolean
}

export interface GooeyToastOptions {
  description?: GooeyToastContent
  action?: GooeyToastAction
  icon?: GooeyToastContent | null
  duration?: number
  id?: string | number
  classNames?: GooeyToastClassNames
  fillColor?: string
  borderColor?: string
  borderWidth?: number
  timing?: GooeyToastTimings
  preset?: AnimationPresetName
  spring?: boolean
  bounce?: number
  showProgress?: boolean
  showTimestamp?: boolean
  onDismiss?: (id: string | number) => void
  onAutoClose?: (id: string | number) => void
}

export interface GooeyPromiseData<T> {
  loading: string
  success: string | ((data: T) => string)
  error: string | ((error: unknown) => string)
  description?: {
    loading?: GooeyToastContent
    success?: string | ((data: T) => GooeyToastContent)
    error?: string | ((error: unknown) => GooeyToastContent)
  }
  action?: {
    success?: GooeyToastAction
    error?: GooeyToastAction
  }
  classNames?: GooeyToastClassNames
  fillColor?: string
  borderColor?: string
  borderWidth?: number
  timing?: GooeyToastTimings
  preset?: AnimationPresetName
  spring?: boolean
  bounce?: number
  showTimestamp?: boolean
  onDismiss?: (id: string | number) => void
  onAutoClose?: (id: string | number) => void
}

export type GooeyToastPhase = 'loading' | 'default' | 'success' | 'error' | 'warning' | 'info'

export interface GooeyToastUpdateOptions {
  title?: string
  description?: GooeyToastContent
  type?: GooeyToastType
  action?: GooeyToastAction
  icon?: GooeyToastContent | null
  showTimestamp?: boolean
}

export interface DismissFilter {
  type: GooeyToastType | GooeyToastType[]
}

export interface GooeyToasterProps {
  position?: ToasterProps['position']
  duration?: number
  gap?: number
  offset?: number | string
  theme?: 'light' | 'dark'
  toastOptions?: Partial<ExternalToast>
  expand?: boolean
  closeButton?: boolean | 'top-left' | 'top-right'
  richColors?: boolean
  visibleToasts?: number
  dir?: 'ltr' | 'rtl'
  preset?: AnimationPresetName
  spring?: boolean
  bounce?: number
  swipeToDismiss?: boolean
  closeOnEscape?: boolean
  maxQueue?: number
  queueOverflow?: 'drop-oldest' | 'drop-newest'
  showProgress?: boolean
  showTimestamp?: boolean
}

export interface GooeyToastProps {
  title: string
  description?: GooeyToastContent
  type: GooeyToastType
  action?: GooeyToastAction
  icon?: GooeyToastContent | null
  phase: GooeyToastPhase
  classNames?: GooeyToastClassNames
  fillColor?: string
  borderColor?: string
  borderWidth?: number
  timing?: GooeyToastTimings
  preset?: AnimationPresetName
  spring?: boolean
  bounce?: number
  showProgress?: boolean
  showTimestamp?: boolean
  toastId?: string | number
}
