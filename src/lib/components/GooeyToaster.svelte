<script lang="ts">
  import { Toaster } from 'svelte-sonner'
  import type { GooeyToasterProps } from '../types.js'
  import { animationPresets } from '../presets.js'
  import {
    setGooeyPosition,
    setGooeyDir,
    setGooeySpring,
    setGooeyBounce,
    setGooeyVisibleToasts,
    setContainerHovered,
    setGooeySwipeToDismiss,
    setGooeyCloseOnEscape,
    setGooeyTheme,
    setGooeyMaxQueue,
    setGooeyQueueOverflow,
    setGooeyShowProgress,
    setGooeyCloseButton,
    setGooeyShowTimestamp,
  } from '../context.js'
  import { gooeyToast, _getMostRecentActiveId } from '../gooey-toast.js'
  import { isDev } from '../is-dev.js'
  import AriaLiveAnnouncer from './AriaLiveAnnouncer.svelte'

  let {
    position = 'bottom-right',
    duration,
    gap = 14,
    offset = '24px',
    theme = 'light',
    toastOptions,
    expand,
    closeButton,
    richColors,
    visibleToasts,
    dir,
    preset,
    spring,
    bounce,
    swipeToDismiss = true,
    closeOnEscape = true,
    maxQueue = Infinity,
    queueOverflow = 'drop-oldest',
    showProgress = false,
    showTimestamp = true,
  }: GooeyToasterProps = $props()

  const presetConfig = $derived(preset ? animationPresets[preset] : undefined)
  const resolvedSpring = $derived(spring ?? presetConfig?.spring ?? true)
  const resolvedBounce = $derived(bounce ?? presetConfig?.bounce)

  $effect(() => {
    setGooeyPosition(position)
  })

  $effect(() => {
    setGooeyDir(dir ?? 'ltr')
  })

  $effect(() => {
    setGooeyTheme(theme)
  })

  $effect(() => {
    setGooeySpring(resolvedSpring)
  })

  $effect(() => {
    setGooeyBounce(resolvedBounce)
  })

  $effect(() => {
    setGooeySwipeToDismiss(swipeToDismiss)
  })

  $effect(() => {
    setGooeyCloseOnEscape(closeOnEscape)
  })

  $effect(() => {
    if (!closeOnEscape) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        const recentId = _getMostRecentActiveId()
        if (recentId != null) {
          gooeyToast.dismiss(recentId)
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  })

  $effect(() => {
    setGooeyVisibleToasts(visibleToasts ?? 3)
  })

  $effect(() => {
    setGooeyMaxQueue(maxQueue)
  })

  $effect(() => {
    setGooeyQueueOverflow(queueOverflow)
  })

  $effect(() => {
    setGooeyShowProgress(showProgress)
  })

  $effect(() => {
    setGooeyCloseButton(closeButton ?? false)
  })

  $effect(() => {
    setGooeyShowTimestamp(showTimestamp)
  })

  // Detect hover on the Sonner container and broadcast to all GooeyToast instances.
  // Uses Sonner's `data-expanded` attribute (set per-toast <li>) as the hover signal
  // rather than raw mouseenter/mouseleave on the <ol>. This is more reliable because
  // Sonner manages it with onMouseEnter + onMouseMove + onMouseLeave, and it survives
  // <ol> remounts (all toasts dismissed then new ones appear).
  $effect(() => {
    let expandObs: MutationObserver | null = null
    let currentOl: HTMLElement | null = null

    const syncFromExpanded = (ol: HTMLElement) => {
      const anyExpanded = ol.querySelector('[data-sonner-toast][data-expanded="true"]') !== null
      setContainerHovered(anyExpanded)
    }

    const attach = (ol: HTMLElement) => {
      if (ol === currentOl) return
      expandObs?.disconnect()
      currentOl = ol
      expandObs = new MutationObserver(() => syncFromExpanded(ol))
      expandObs.observe(ol, {
        attributes: true,
        attributeFilter: ['data-expanded'],
        subtree: true,
      })
      syncFromExpanded(ol)
    }

    const el = document.querySelector<HTMLElement>('[data-sonner-toaster]')
    if (el) attach(el)

    // Re-discover if the <ol> is remounted (e.g. all toasts dismissed then new ones appear).
    // Debounce via rAF to coalesce rapid DOM mutations (e.g. multiple toasts mounting).
    let bodyRafId = 0
    const bodyObs = new MutationObserver(() => {
      if (bodyRafId) return
      bodyRafId = requestAnimationFrame(() => {
        bodyRafId = 0
        const found = document.querySelector<HTMLElement>('[data-sonner-toaster]')
        if (found) {
          attach(found)
        } else if (currentOl) {
          expandObs?.disconnect()
          currentOl = null
          setContainerHovered(false)
        }
      })
    })
    bodyObs.observe(document.body, { childList: true, subtree: true })

    return () => {
      if (bodyRafId) cancelAnimationFrame(bodyRafId)
      bodyObs.disconnect()
      expandObs?.disconnect()
      setContainerHovered(false)
    }
  })

  $effect(() => {
    if (!isDev) return

    const el = document.createElement('div')
    el.setAttribute('data-gooey-toast-css', '')
    el.style.position = 'absolute'
    el.style.width = '0'
    el.style.height = '0'
    el.style.overflow = 'hidden'
    el.style.pointerEvents = 'none'
    document.body.appendChild(el)

    const value = getComputedStyle(el).getPropertyValue('--gooey-toast')
    document.body.removeChild(el)

    if (!value) {
      console.warn(
        '[goey-toast-svelte] Styles not found. Make sure to import the CSS:\n\n' +
          '  import "goey-toast-svelte/styles.css";\n'
      )
    }
  })
</script>

<Toaster
  {position}
  {duration}
  {gap}
  {offset}
  {theme}
  toastOptions={{ unstyled: true, ...toastOptions }}
  {expand}
  closeButton={false}
  {richColors}
  visibleToasts={99}
  {dir}
/>
<AriaLiveAnnouncer />
