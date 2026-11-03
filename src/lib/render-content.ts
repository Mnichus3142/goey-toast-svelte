import type { Component, Snippet } from 'svelte'
import type { GooeyToastContent } from './types.js'

/** True when value is a plain string description/title. */
export function isStringContent(value: unknown): value is string {
  return typeof value === 'string'
}

/**
 * Heuristic: Svelte 5 snippets are functions with arity matching their params.
 * Components typically accept a single props object (arity 1) but also carry
 * internal metadata. Prefer treating non-string callables as snippets when
 * rendering body content; icons often pass Components.
 */
export function isSnippetContent(value: unknown): value is Snippet {
  return typeof value === 'function'
}

export function isComponentContent(value: unknown): value is Component {
  return typeof value === 'function'
}

export type { GooeyToastContent }
