/** Library-safe DEV check (avoids Vite-only env APIs). */
export const isDev =
  typeof process !== 'undefined' && process.env?.NODE_ENV === 'development'
