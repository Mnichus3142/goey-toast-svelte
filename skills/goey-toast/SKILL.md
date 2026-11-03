---
name: goey-toast-svelte
description: Install and use goey-toast-svelte — a gooey, morphing Svelte 5 toast component built on svelte-sonner with Motion. Use when adding toast/notification UI to a Svelte app (success/error/warning/info/promise toasts), or when the user mentions goey-toast / gooey toast / goey-toast-svelte.
license: MIT
---

# goey-toast-svelte

A gooey, morphing Svelte 5 toast component built on svelte-sonner with Motion
animations (pill → blob → pill). Use this skill to install the package and write
correct usage code in any Svelte 5 project.

## When to use

- Adding toast / notification UI to a Svelte 5 app.
- The user mentions "goey-toast", "gooey toast", "goey-toast-svelte", or wants animated/morphing toasts.
- Replacing raw `svelte-sonner` toasts with the gooey variant.

## Install

```bash
npm install goey-toast-svelte svelte motion
```

Peer deps (must exist in the host app):

| Package | Version  |
| ------- | -------- |
| svelte  | >= 5.0.0 |
| motion  | >= 11.0.0 |

## Two required steps to render toasts

1. **Mount `<GooeyToaster />` once** near the app root.
2. **Import the stylesheet once** at the entry point. Without it toasts render
   unstyled.

```svelte
<script lang="ts">
  import { GooeyToaster, gooeyToast } from 'goey-toast-svelte'
  import 'goey-toast-svelte/styles.css' // REQUIRED — import once at app entry
</script>

<GooeyToaster position="bottom-right" />
<button onclick={() => gooeyToast.success('Saved!')}>Save</button>
```

## API: `gooeyToast`

```ts
gooeyToast(title, options?)         // default (neutral)
gooeyToast.success(title, options?) // green
gooeyToast.error(title, options?)   // red
gooeyToast.warning(title, options?) // yellow
gooeyToast.info(title, options?)    // blue
gooeyToast.promise(promise, data)   // loading → success/error
gooeyToast.update(id, options)      // update an existing toast in-place
gooeyToast.dismiss(idOrFilter?)     // dismiss one, by type, or all
```

### Common options (2nd arg)

| Option          | Type                | Notes                                          |
| --------------- | ------------------- | ---------------------------------------------- |
| `description`   | `string \| Snippet` | String or Svelte snippet body                  |
| `action`        | `GooeyToastAction`  | `{ label, onClick, successLabel? }`            |
| `icon`          | `Snippet \| Component \| null` | Custom icon (`null` clears in `update`) |
| `duration`      | `number`            | ms                                             |
| `id`            | `string \| number`  | Stable id (needed for `update`)                |
| `fillColor` / `borderColor` / `borderWidth` | colors / px | Blob styling                  |
| `spring` / `bounce` | `boolean` / `number` | bounce `0.05`–`0.8`, default `0.4`        |
| `preset`        | `'smooth' \| 'bouncy' \| 'subtle' \| 'snappy'` | Animation preset    |
| `showProgress`  | `boolean`           | Countdown bar                                  |
| `showTimestamp` | `boolean`           | Default `true`                                 |
| `onDismiss` / `onAutoClose` | `(id) => void` | Dismiss callbacks                    |

### `<GooeyToaster />` key props

`position` (`'top-left'|'top-center'|'top-right'|'bottom-left'|'bottom-center'|'bottom-right'`, default `'bottom-right'`),
`theme` (`'light'|'dark'`), `closeButton`, `showProgress`, `closeOnEscape`,
`maxQueue`, `queueOverflow` (`'drop-oldest'|'drop-newest'`), `dir` (`'ltr'|'rtl'`),
`spring`, `bounce`, `preset`, `swipeToDismiss`, `showTimestamp`, `gap`, `offset`.

## Recipes

### Description + action button

```ts
gooeyToast.info('Share link ready', {
  description: 'Your link has been generated.',
  action: {
    label: 'Copy',
    onClick: () => navigator.clipboard.writeText(url),
    successLabel: 'Copied!', // morphs back to pill after click
  },
})
```

### Promise toast

```ts
gooeyToast.promise(saveData(), {
  loading: 'Saving...',
  success: (data) => `Saved ${data.count} items`,
  error: (e) => `Failed: ${String(e)}`,
  description: { success: 'All changes synced.', error: 'Try again later.' },
  action: { error: { label: 'Retry', onClick: () => retry() } },
})
```

### Update in place

```ts
const id = gooeyToast('Uploading...')
gooeyToast.update(id, { title: 'Done', type: 'success', icon: null })
```

### Dismiss by filter

```ts
gooeyToast.dismiss(id)                       // one
gooeyToast.dismiss({ type: 'error' })        // all errors
gooeyToast.dismiss({ type: ['error','warning'] })
gooeyToast.dismiss()                         // all
```

## Gotchas

- Forgetting `import 'goey-toast-svelte/styles.css'` → unstyled toasts. Most common bug.
- `<GooeyToaster />` must be mounted exactly once, near the root.
- `update()` requires the same `id` returned from the create call.
- `motion` is a peer dep — install it explicitly.
- Svelte 5 runes only — requires Svelte >= 5.
- Backward-compat aliases exist (`GoeyToaster`, `goeyToast`) for v0.2.x; prefer
  the double-`o` names (`GooeyToaster`, `gooeyToast`).

## Reference

- GitHub: https://github.com/Mnichus3142/goey-toast-svelte
- npm: https://www.npmjs.com/package/goey-toast-svelte
