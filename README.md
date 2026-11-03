# goey-toast-svelte

[![goey-toast-svelte](https://raw.githubusercontent.com/Mnichus3142/goey-toast-svelte/main/demo/public/og-image.png)](https://github.com/Mnichus3142/goey-toast-svelte)

## Features

- Organic blob morph animation (pill &rarr; blob &rarr; pill)
- Five toast types: default, success, error, warning, info
- Promise toasts with loading &rarr; success/error transitions
- Action buttons with optional success label morph-back
- Description body supporting strings and Svelte snippets/components
- Configurable display duration and bounce intensity
- Custom fill color, border color, and border width
- CSS class overrides via `classNames` prop
- 6 positions with automatic horizontal mirroring for right-side positions
- Center positions with symmetric morph animation
- Hover pause: hovering an expanded toast pauses the dismiss timer
- Hover re-expand: hovering a collapsed pill re-expands the toast
- Pre-dismiss collapse animation
- In-place toast updates via `gooeyToast.update()`
- Dismiss by type filter: `gooeyToast.dismiss({ type: 'error' })`
- Dark mode and RTL layout support
- Animation presets: smooth, bouncy, subtle, snappy
- Timestamp display on expanded toasts with optional `showTimestamp` toggle
- Close button with configurable position (`top-left` / `top-right`)
- Countdown progress bar with hover-pause and re-expand
- Keyboard dismiss (Escape) and swipe-to-dismiss on mobile
- Toast queue with configurable overflow strategy
- Dismiss callbacks: `onDismiss` and `onAutoClose`

## Installation

```bash
npm install goey-toast-svelte
```

### AI Agents (Skill)

goey-toast ships a bundled [Agent Skill](https://www.skills.sh/) (`SKILL.md`) so coding agents (Claude Code, Cursor, etc.) know how to install and use it correctly — the required `<GooeyToaster />` mount, the `styles.css` import, and the full API.

Install from the skills.sh registry:

```bash
npx skills add Mnichus3142/goey-toast-svelte  # or copy from this package
```

Or copy the skill into your project from the package itself:

```bash
npx goey-toast-svelte add-skill            # -> .claude/skills/goey-toast/SKILL.md
npx goey-toast-svelte add-skill --agents   # also append an AGENTS.md pointer
npx goey-toast-svelte add-skill --dir .cursor/skills/goey-toast
```

### Peer Dependencies

goey-toast-svelte requires the following peer dependencies:

```bash
npm install svelte motion
```

| Package        | Version    |
| -------------- | ---------- |
| svelte         | >= 5.0.0   |
| motion         | >= 11.0.0  |

### CSS Import (Required)

You **must** import the goey-toast stylesheet for the component to render correctly:

```tsx
import 'goey-toast-svelte/styles.css'
```

Add this import once in your app's entry point (e.g., `main.ts` or `App.svelte`). Without it, toasts will appear unstyled.

## Quick Start

```svelte
<script lang="ts">
  import { GooeyToaster, gooeyToast } from 'goey-toast-svelte'
  import 'goey-toast-svelte/styles.css'
</script>

<GooeyToaster position="bottom-right" />
<button onclick={() => gooeyToast.success('Saved!')}>Save</button>
```

## API Reference

### `gooeyToast` Methods

```ts
gooeyToast(title, options?)              // default (neutral)
gooeyToast.success(title, options?)      // green
gooeyToast.error(title, options?)        // red
gooeyToast.warning(title, options?)      // yellow
gooeyToast.info(title, options?)         // blue
gooeyToast.promise(promise, data)        // loading -> success/error
gooeyToast.update(id, options)           // update an existing toast in-place
gooeyToast.dismiss(idOrFilter?)          // dismiss one, by type, or all toasts
```

#### `gooeyToast.update(id, options)`

Updates an existing toast in-place without removing and re-creating it.

```ts
const id = gooeyToast('Uploading...')

// Later, update the toast
gooeyToast.update(id, {
  title: 'Upload complete',
  type: 'success',
  description: '3 files uploaded.',
  icon: null, // clears the custom icon
})
```

**`GooeyToastUpdateOptions`:**

| Option        | Type              | Description                   |
| ------------- | ----------------- | ----------------------------- |
| `title`       | `string`          | New title text                |
| `description` | `string \| Snippet`       | New body content              |
| `type`        | `GooeyToastType`   | Change the toast type/color   |
| `action`      | `GooeyToastAction` | New action button             |
| `icon`        | `Snippet \| Component \| null` | Custom icon (pass `null` to clear) |

#### `gooeyToast.dismiss(idOrFilter?)`

Dismiss a single toast by ID, all toasts of a given type, or all toasts at once.

```ts
// Dismiss a specific toast
gooeyToast.dismiss(toastId)

// Dismiss all error toasts
gooeyToast.dismiss({ type: 'error' })

// Dismiss multiple types
gooeyToast.dismiss({ type: ['error', 'warning'] })

// Dismiss all toasts
gooeyToast.dismiss()
```

### `GooeyToastOptions`

Options passed as the second argument to `gooeyToast()` and type-specific methods.

| Option        | Type                 | Description                        |
| ------------- | -------------------- | ---------------------------------- |
| `description` | `string \| Snippet`          | Body content (string or component) |
| `action`      | `GooeyToastAction`    | Action button configuration        |
| `icon`        | `string \| Snippet`          | Custom icon override               |
| `duration`    | `number`             | Display duration in ms             |
| `id`          | `string \| number`   | Unique toast identifier            |
| `classNames`  | `GooeyToastClassNames`| CSS class overrides                |
| `fillColor`   | `string`             | Background color of the blob       |
| `borderColor` | `string`             | Border color of the blob           |
| `borderWidth` | `number`             | Border width in px (default 1.5)   |
| `timing`      | `GooeyToastTimings`   | Animation timing overrides         |
| `spring`      | `boolean`            | Enable spring/bounce animations (default `true`) |
| `bounce`      | `number`             | Spring intensity from `0.05` (subtle) to `0.8` (dramatic), default `0.4` |
| `showTimestamp` | `boolean`         | Show/hide timestamp in toast header/body (default `true`) |
| `showProgress`| `boolean`            | Show countdown progress bar                      |
| `onDismiss`   | `(id) => void`       | Called when toast is dismissed (any reason)       |
| `onAutoClose` | `(id) => void`       | Called only on timer-based auto-dismiss           |
| `preset`      | `AnimationPresetName`| Animation preset (`'smooth'`, `'bouncy'`, `'subtle'`, `'snappy'`) |

### `GooeyToastAction`

| Property       | Type       | Required | Description                                  |
| -------------- | ---------- | -------- | -------------------------------------------- |
| `label`        | `string`   | Yes      | Button text                                  |
| `onClick`      | `() => void` | Yes   | Click handler                                |
| `successLabel` | `string`   | No       | Label shown after click (morphs back to pill)|

### `GooeyToastTimings`

Fine-tune animation speeds per toast.

| Property           | Type     | Default | Description                          |
| ------------------ | -------- | ------- | ------------------------------------ |
| `displayDuration`  | `number` | 4000    | Milliseconds toast stays expanded    |

### `GooeyToastClassNames`

Override styles for any part of the toast.

| Key             | Target           |
| --------------- | ---------------- |
| `wrapper`       | Outer container  |
| `content`       | Content area     |
| `header`        | Icon + title row |
| `title`         | Title text       |
| `icon`          | Icon wrapper     |
| `description`   | Body text        |
| `actionWrapper` | Button container |
| `actionButton`  | Action button    |

### `GooeyToasterProps`

Props for the `<GooeyToaster />` component.

| Prop         | Type                                  | Default          | Description                                   |
| ------------ | ------------------------------------- | ---------------- | --------------------------------------------- |
| `position`   | `'top-left' \| 'top-center' \| 'top-right' \| 'bottom-left' \| 'bottom-center' \| 'bottom-right'` | `'bottom-right'` | Toast position |
| `duration`   | `number`                              | --               | Default display duration in ms                |
| `gap`        | `number`                              | `14`             | Gap between stacked toasts (px)               |
| `offset`     | `number \| string`                    | `'24px'`         | Distance from screen edge                     |
| `theme`      | `'light' \| 'dark'`                   | `'light'`        | Color theme                                   |
| `toastOptions` | `Partial<ExternalToast>`            | --               | Default options passed to Sonner              |
| `spring`     | `boolean`                             | `true`           | Enable spring/bounce animations globally      |
| `bounce`     | `number`                              | `0.4`            | Spring intensity: `0.05` (subtle) to `0.8` (dramatic) |
| `preset`     | `AnimationPresetName`                 | --               | Animation preset for all toasts               |
| `closeOnEscape` | `boolean`                          | `true`           | Dismiss most recent toast on Escape key       |
| `closeButton`  | `boolean \| 'top-left' \| 'top-right'` | `false`       | Show close button on hover                    |
| `showProgress` | `boolean`                           | `false`          | Show countdown progress bar on all toasts     |
| `maxQueue`   | `number`                              | `Infinity`       | Maximum queued toasts                         |
| `queueOverflow` | `'drop-oldest' \| 'drop-newest'`   | `'drop-oldest'`  | Queue overflow strategy                       |
| `dir`        | `'ltr' \| 'rtl'`                     | `'ltr'`          | Layout direction                              |
| `swipeToDismiss` | `boolean`                         | `true`           | Enable swipe-to-dismiss on mobile             |
| `showTimestamp` | `boolean`                         | `true`           | Show/hide timestamp on all toasts globally     |

### `GooeyPromiseData<T>`

Configuration for `gooeyToast.promise()`.

| Property      | Type                                          | Required | Description                                    |
| ------------- | --------------------------------------------- | -------- | ---------------------------------------------- |
| `loading`     | `string`                                      | Yes      | Title shown during loading                     |
| `success`     | `string \| ((data: T) => string)`             | Yes      | Title on success (static or derived from result)|
| `error`       | `string \| ((error: unknown) => string)`      | Yes      | Title on error (static or derived from error)  |
| `description` | `object`                                      | No       | Per-phase descriptions (see below)             |
| `action`      | `object`                                      | No       | Per-phase action buttons (see below)           |
| `classNames`  | `GooeyToastClassNames`                         | No       | CSS class overrides                            |
| `fillColor`   | `string`                                      | No       | Background color of the blob                   |
| `borderColor` | `string`                                      | No       | Border color of the blob                       |
| `borderWidth` | `number`                                      | No       | Border width in px                             |
| `timing`      | `GooeyToastTimings`                            | No       | Animation timing overrides                     |
| `spring`      | `boolean`                                     | No       | Enable spring/bounce animations (default `true`) |
| `bounce`      | `number`                                      | No       | Spring intensity: `0.05` (subtle) to `0.8` (dramatic), default `0.4` |
| `onDismiss`   | `(id: string \| number) => void`              | No       | Called when toast is dismissed (any reason)       |
| `onAutoClose` | `(id: string \| number) => void`              | No       | Called only on timer-based auto-dismiss           |

**`description` sub-fields:**

| Key       | Type                                                     |
| --------- | -------------------------------------------------------- |
| `loading` | `string \| Snippet`                                      |
| `success` | `string \| ((data: T) => string \| Snippet)`             |
| `error`   | `string \| ((error: unknown) => string \| Snippet)`      |

**`action` sub-fields:**

| Key       | Type              |
| --------- | ----------------- |
| `success` | `GooeyToastAction` |
| `error`   | `GooeyToastAction` |

## Usage Examples

### Description

```tsx
gooeyToast.error('Payment failed', {
  description: 'Your card was declined. Please try again.',
})
```

### Custom Snippet as Description

```svelte
<script lang="ts">
  import { gooeyToast } from 'goey-toast-svelte'

  function show() {
    gooeyToast.success('Deployment complete', {
      description: deployDetails,
    })
  }
</script>

{#snippet deployDetails()}
  <div style="display:flex;flex-direction:column;gap:10px">
    <div><span>Environment:</span> <strong>Production</strong></div>
    <div><span>Branch:</span> <strong>main @ 3f8a2c1</strong></div>
  </div>
{/snippet}
```

### Action Button with Success Label

```tsx
gooeyToast.info('Share link ready', {
  description: 'Your link has been generated.',
  action: {
    label: 'Copy to Clipboard',
    onClick: () => navigator.clipboard.writeText(url),
    successLabel: 'Copied!',
  },
})
```

### Promise Toast

```tsx
gooeyToast.promise(saveData(), {
  loading: 'Saving...',
  success: 'Changes saved',
  error: 'Something went wrong',
  description: {
    success: 'All changes have been synced.',
    error: 'Please try again later.',
  },
  action: {
    error: {
      label: 'Retry',
      onClick: () => retry(),
    },
  },
})
```

### Custom Styling

```tsx
gooeyToast.success('Styled!', {
  fillColor: '#1a1a2e',
  borderColor: '#333',
  borderWidth: 2,
  classNames: {
    wrapper: 'my-wrapper',
    title: 'my-title',
    description: 'my-desc',
    actionButton: 'my-btn',
  },
})
```

### Display Duration

```tsx
gooeyToast.success('Saved', {
  description: 'Your changes have been synced.',
  timing: { displayDuration: 5000 },
})
```

### Disabling Spring Animations

Disable bounce/spring animations for a cleaner, more subtle look:

```tsx
// Per-toast: disable spring for this toast only
gooeyToast.success('Saved', {
  description: 'Your changes have been synced.',
  spring: false,
})

// Globally: disable spring for all toasts
<GooeyToaster spring={false} />
```

When `spring` is `false`, all spring-based animations (landing squish, blob squish, morph transitions, pill resize, header squish) use smooth ease-in-out curves instead. Error shake animations still work regardless of this setting.

### Bounce Intensity

Control how dramatic the spring effect feels with a single `bounce` value:

```tsx
// Subtle, barely-there spring
gooeyToast.success('Saved', { bounce: 0.1 })

// Default feel
gooeyToast.success('Saved', { bounce: 0.4 })

// Jelly mode
gooeyToast.success('Saved', { bounce: 0.8 })

// Set globally via GooeyToaster
<GooeyToaster bounce={0.6} />
```

The `bounce` value (0.05 to 0.8) controls spring stiffness, damping, and squish magnitude together so you get a consistent feel from one number.

### Dark Mode

```tsx
<GooeyToaster theme="dark" />
```

### RTL Support

```tsx
<GooeyToaster dir="rtl" />
```

### Animation Presets

Four built-in presets: `smooth`, `bouncy`, `subtle`, `snappy`. Apply per-toast or globally:

```tsx
gooeyToast.success('Saved', { preset: 'bouncy' })

// Or globally
<GooeyToaster preset="smooth" />
```

### Progress Bar

Show a countdown progress bar on toasts:

```tsx
gooeyToast.success('Saved', { showProgress: true })

// Or enable globally
<GooeyToaster showProgress />
```

### Keyboard Shortcuts

Press **Escape** to dismiss the most recent toast. Enabled by default; disable with `closeOnEscape={false}`.

### Swipe to Dismiss

On mobile, swipe toasts to dismiss them. Enabled by default; disable with `swipeToDismiss={false}`.

### Close Button

Show a close button on hover. Position it `top-left` (default) or `top-right`:

```tsx
<GooeyToaster closeButton />
<GooeyToaster closeButton="top-left" />
<GooeyToaster closeButton="top-right" />
```

The close button inherits the toast's border and fill color styling. Hidden during the loading phase of promise toasts.

### Hiding Timestamps

```tsx
// Per-toast: hide timestamp for this toast only
gooeyToast.success('Saved', { showTimestamp: false })

// Globally: hide timestamp for all toasts
<GooeyToaster showTimestamp={false} />
```

## Exports

```ts
// Components
export { GooeyToaster } from 'goey-toast-svelte'

// Toast function
export { gooeyToast } from 'goey-toast-svelte'

// Animation presets
export { animationPresets } from 'goey-toast-svelte'

// Types
export type {
  GooeyToastOptions,
  GooeyPromiseData,
  GooeyToasterProps,
  GooeyToastAction,
  GooeyToastClassNames,
  GooeyToastTimings,
  GooeyToastUpdateOptions,
  DismissFilter,
  AnimationPreset,
  AnimationPresetName,
} from 'goey-toast-svelte'
```

## Browser Support

goey-toast works in all modern browsers that support:

- CSS Modules
- SVG path animations
- ResizeObserver
- `framer-motion` (Chrome, Firefox, Safari, Edge)

## See Also

- **[goey-toast](https://github.com/anl331/goey-toast)** — Original React implementation of goey-toast. [Live Demo](https://goey-toast.vercel.app)
- **[gooey-search-tabs](https://github.com/anl331/gooey-search-tabs)** — A morphing search bar with animated tab navigation for React. [Live Demo](https://gooey-search-tabs.vercel.app)

## License

[MIT](./LICENSE)
