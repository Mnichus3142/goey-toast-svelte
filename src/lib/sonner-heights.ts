import { PH } from './animation.js'

/**
 * Singleton MutationObserver registry — one observer per <ol> element shared
 * across all GooeyToast instances mounted under that list. Each toast registers
 * its own callback; the shared observer batches mutations and invokes
 * every registered callback once per mutation batch.
 */
const observerRegistry = new Map<Element, {
  observer: MutationObserver
  callbacks: Set<() => void>
}>()

export function registerSonnerObserver(ol: Element, callback: () => void) {
  let entry = observerRegistry.get(ol)
  if (!entry) {
    const callbacks = new Set<() => void>()
    const observeOptions: MutationObserverInit = {
      attributes: true,
      attributeFilter: ['style', 'data-visible'],
      subtree: true,
      childList: true,
    }
    // Correct offsets synchronously within the MutationObserver microtask
    // (which runs before paint) so Sonner's stale --offset is overwritten in
    // the same frame it was written.
    const observer = new MutationObserver(() => {
      observer.disconnect()
      try {
        for (const cb of callbacks) {
          cb()
        }
      } finally {
        observer.observe(ol, observeOptions)
      }
    })
    observer.observe(ol, observeOptions)
    entry = { observer, callbacks }
    observerRegistry.set(ol, entry)
  }
  entry.callbacks.add(callback)
  return () => {
    entry!.callbacks.delete(callback)
    if (entry!.callbacks.size === 0) {
      entry!.observer.disconnect()
      observerRegistry.delete(ol)
    }
  }
}

/**
 * Recalculates CSS variables on all sibling toast <li> elements.
 *
 * Sonner measures height once on mount (~34px pill) and never re-measures
 * toast.custom() content. This function corrects --initial-height and --offset
 * so morphing toasts stack correctly.
 */
export function syncSonnerHeights(
  wrapperEl: HTMLElement | null,
  includeOffsets = false,
) {
  if (!wrapperEl) return
  const li = wrapperEl.closest('[data-sonner-toast]') as HTMLElement | null
  if (!li?.parentElement) return

  const ol = li.parentElement
  const toasts = Array.from(
    ol.querySelectorAll(':scope > [data-sonner-toast]')
  ) as HTMLElement[]

  if (toasts.length === 0) return

  const heights = toasts.map(t => {
    if (t.getAttribute('data-visible') === 'false') return 0
    const content = t.firstElementChild as HTMLElement | null
    const h = content ? content.getBoundingClientRect().height : 0
    return h > 0 ? h : PH
  })

  for (let i = 0; i < toasts.length; i++) {
    toasts[i].style.setProperty('--initial-height', `${heights[i]}px`)
  }

  if (!includeOffsets) {
    return
  }

  const gapStr = getComputedStyle(ol).getPropertyValue('--gap').trim()
  const gap = parseFloat(gapStr) || 14

  let runningOffset = 0
  for (let i = toasts.length - 1; i >= 0; i--) {
    if (toasts[i].getAttribute('data-visible') === 'false') {
      toasts[i].style.setProperty('--offset', '0px')
      continue
    }
    toasts[i].style.setProperty('--offset', `${runningOffset}px`)
    if (i > 0) {
      runningOffset += heights[i] + gap
    }
  }
}
