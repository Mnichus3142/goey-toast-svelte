<script lang="ts">
  import { untrack } from 'svelte'
  import GooeyToast from './GooeyToast.svelte'
  import type {
    GooeyToastAction,
    GooeyToastClassNames,
    GooeyToastContent,
    GooeyToastPhase,
    GooeyToastTimings,
    GooeyToastType,
    GooeyToastUpdateOptions,
  } from '../types.js'
  import type { AnimationPresetName } from '../presets.js'
  import {
    _onToastDismissed,
    _registerToastCallbacks,
    _subscribeToastUpdate,
  } from '../gooey-toast.js'
  import { isDev } from '../is-dev.js'

  interface Props {
    initialPhase: GooeyToastPhase
    title: string
    type: GooeyToastType
    description?: GooeyToastContent
    action?: GooeyToastAction
    icon?: GooeyToastContent | null
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
    toastId: string | number
    onDismiss?: (id: string | number) => void
    onAutoClose?: (id: string | number) => void
  }

  let {
    initialPhase,
    title: initialTitle,
    type: initialType,
    description: initialDescription,
    action: initialAction,
    icon,
    classNames,
    fillColor,
    borderColor,
    borderWidth,
    timing,
    preset,
    spring,
    bounce,
    showProgress,
    showTimestamp: initialShowTimestamp,
    toastId,
    onDismiss,
    onAutoClose,
  }: Props = $props()

  // Seed once from initial props (like React useState); later updates via gooeyToast.update
  let title = $state(untrack(() => initialTitle))
  let type = $state(untrack(() => initialType))
  let phase = $state(untrack(() => initialPhase))
  let description = $state(untrack(() => initialDescription))
  let action = $state(untrack(() => initialAction))
  let currentIcon = $state(untrack(() => icon))
  let showTimestamp = $state(untrack(() => initialShowTimestamp))

  $effect(() => {
    if (onDismiss || onAutoClose) {
      _registerToastCallbacks(toastId, { onDismiss, onAutoClose })
    }
  })

  $effect(() => {
    return _subscribeToastUpdate(toastId, (opts: GooeyToastUpdateOptions) => {
      if (opts.title !== undefined) title = opts.title
      if (opts.description !== undefined) description = opts.description
      if (opts.type !== undefined) {
        type = opts.type
        phase = opts.type
      }
      if (opts.action !== undefined) action = opts.action
      if ('icon' in opts) currentIcon = opts.icon ?? undefined
      if (opts.showTimestamp !== undefined) showTimestamp = opts.showTimestamp
    })
  })

  // Free queue slot on unmount (delayed to survive remounts)
  let mounted = true
  $effect(() => {
    mounted = true
    return () => {
      mounted = false
      setTimeout(() => {
        if (!mounted) _onToastDismissed(toastId)
      }, 100)
    }
  })
</script>

<svelte:boundary onerror={(error) => {
  if (isDev) {
    console.error('[GooeyToast] Rendering error:', error)
  }
}}>
  <GooeyToast
    {title}
    {description}
    {type}
    {action}
    icon={currentIcon}
    {phase}
    {classNames}
    {fillColor}
    {borderColor}
    {borderWidth}
    {timing}
    {preset}
    {spring}
    {bounce}
    {showProgress}
    {showTimestamp}
    {toastId}
  />
</svelte:boundary>
