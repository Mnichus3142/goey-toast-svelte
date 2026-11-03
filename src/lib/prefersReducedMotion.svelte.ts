const QUERY = '(prefers-reduced-motion: reduce)'

function getInitialState(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false
  }
  return window.matchMedia(QUERY).matches
}

/**
 * Reactive prefers-reduced-motion flag for Svelte 5 runes components.
 * Call once at component top level: `const reduced = prefersReducedMotion()`
 */
export function prefersReducedMotion(): { readonly current: boolean } {
  let current = $state(getInitialState())

  $effect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return
    }
    const mql = window.matchMedia(QUERY)
    const handler = (event: MediaQueryListEvent) => {
      current = event.matches
    }
    mql.addEventListener('change', handler)
    return () => mql.removeEventListener('change', handler)
  })

  return {
    get current() {
      return current
    },
  }
}
