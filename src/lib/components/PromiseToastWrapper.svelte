<script lang="ts">
  import { untrack } from 'svelte'
  import { toast } from 'svelte-sonner'
  import GooeyToast from './GooeyToast.svelte'
  import Self from './PromiseToastWrapper.svelte'
  import { announce } from '../context.js'
  import {
    _onToastDismissed,
    _registerToastCallbacks,
  } from '../gooey-toast.js'
  import { isDev } from '../is-dev.js'
  import type {
    GooeyPromiseData,
    GooeyToastAction,
    GooeyToastContent,
    GooeyToastPhase,
    GooeyToastType,
  } from '../types.js'

  interface Props {
    promise: Promise<unknown>
    data: GooeyPromiseData<unknown>
    toastId: string | number
  }

  let { promise, data, toastId }: Props = $props()

  const DEFAULT_EXPANDED_DURATION = 4000

  let phase = $state<GooeyToastPhase>('loading')
  let title = $state(untrack(() => data.loading))
  let description = $state(untrack(() => data.description?.loading as GooeyToastContent | undefined))
  let action = $state<GooeyToastAction | undefined>(undefined)

  function buildAnnouncementMessage(t: string, desc?: GooeyToastContent): string {
    if (!desc || typeof desc !== 'string') return t
    return `${t}: ${desc}`
  }

  $effect(() => {
    if (data.onDismiss || data.onAutoClose) {
      _registerToastCallbacks(toastId, {
        onDismiss: data.onDismiss,
        onAutoClose: data.onAutoClose,
      })
    }
  })

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

  $effect(() => {
    const resetDuration = (hasExpandedContent: boolean) => {
      const baseDuration =
        data.timing?.displayDuration ??
        (hasExpandedContent ? DEFAULT_EXPANDED_DURATION : undefined)
      const collapseDurMs = 0.9 * 1000
      const duration =
        baseDuration != null && hasExpandedContent
          ? baseDuration + collapseDurMs
          : baseDuration
      if (duration != null) {
        toast.custom(Self, {
          id: toastId,
          duration,
          componentProps: { promise, data, toastId },
        })
      }
    }

    promise
      .then((result) => {
        const desc =
          typeof data.description?.success === 'function'
            ? data.description.success(result)
            : data.description?.success
        const resolvedTitle =
          typeof data.success === 'function' ? data.success(result) : data.success
        title = resolvedTitle
        description = desc
        action = data.action?.success
        phase = 'success'
        resetDuration(Boolean(desc || data.action?.success))
        announce(buildAnnouncementMessage(resolvedTitle, desc), 'polite')
      })
      .catch((err) => {
        const desc =
          typeof data.description?.error === 'function'
            ? data.description.error(err)
            : data.description?.error
        const resolvedTitle =
          typeof data.error === 'function' ? data.error(err) : data.error
        title = resolvedTitle
        description = desc
        action = data.action?.error
        phase = 'error'
        resetDuration(Boolean(desc || data.action?.error))
        announce(buildAnnouncementMessage(resolvedTitle, desc), 'assertive')
      })
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
    type={phase === 'loading' ? 'info' : (phase as GooeyToastType)}
    {action}
    {phase}
    classNames={data.classNames}
    fillColor={data.fillColor}
    borderColor={data.borderColor}
    borderWidth={data.borderWidth}
    timing={data.timing}
    preset={data.preset}
    spring={data.spring}
    bounce={data.bounce}
    showTimestamp={data.showTimestamp}
    {toastId}
  />
</svelte:boundary>
