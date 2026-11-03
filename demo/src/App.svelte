<script lang="ts">
  import type { Snippet } from 'svelte'
  import { GooeyToaster, gooeyToast, animationPresets } from 'goey-toast-svelte'
  import type { GooeyToastOptions, GooeyToasterProps, AnimationPresetName } from 'goey-toast-svelte'
  import 'goey-toast-svelte/styles.css'
  import './App.css'

  type ToastType = 'default' | 'success' | 'error' | 'warning' | 'info'
  type Page = 'home' | 'changelog'

  function sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  function failAfter(ms: number) {
    return new Promise((_, reject) => setTimeout(() => reject(new Error('Failed')), ms))
  }

  const DEMO_DEFAULTS = {
    spring: true,
    bounce: 0.3,
    timing: {
      displayDuration: 5000,
    },
  } satisfies GooeyToastOptions

  const TOAST_TYPES: ToastType[] = ['default', 'success', 'error', 'warning', 'info']
  const POSITIONS: NonNullable<GooeyToasterProps['position']>[] = [
    'top-left',
    'top-center',
    'top-right',
    'bottom-left',
    'bottom-center',
    'bottom-right',
  ]
  const PRESET_NAMES: AnimationPresetName[] = ['smooth', 'bouncy', 'subtle', 'snappy']

  let installCopied = $state(false)
  let codeCopied = $state(false)

  function copyText(text: string, which: 'install' | 'code') {
    navigator.clipboard.writeText(text)
    if (which === 'install') {
      installCopied = true
      setTimeout(() => {
        installCopied = false
      }, 1500)
    } else {
      codeCopied = true
      setTimeout(() => {
        codeCopied = false
      }, 1500)
    }
  }

  let page = $state<Page>('home')
  let mobileMenuOpen = $state(false)
  let heroVisible = $state(true)
  let heroLanding = $state(false)
  let prevHeroVisible = true
  let landingTimer: ReturnType<typeof setTimeout> | undefined

  // Builder state
  let bPosition = $state<NonNullable<GooeyToasterProps['position']>>('top-left')
  let bType = $state<ToastType>('success')
  let bTitle = $state('Changes saved')
  let bHasDesc = $state(true)
  let bDesc = $state('Your changes have been saved and synced successfully.')
  let bHasAction = $state(false)
  let bActionLabel = $state('Undo')
  let bFillColor = $state('#ffffff')
  let bHasBorder = $state(false)
  let bBorderColor = $state('#E0E0E0')
  let bBorderWidth = $state(1.5)
  let bDisplayDuration = $state(4000)
  let bSpring = $state(true)
  let bBounce = $state(0.4)
  let bPreset = $state<AnimationPresetName | null>(null)
  let bTheme = $state<'light' | 'dark'>('light')
  let bShowProgress = $state(false)
  let bCloseOnEscape = $state(true)
  let bShowTimestamp = $state(true)
  let bCloseButton = $state<boolean | 'top-left' | 'top-right'>(false)

  function setPage(next: Page) {
    page = next
    mobileMenuOpen = false
    window.scrollTo(0, 0)
  }

  function observeHeroTitle(node: HTMLElement) {
    const observer = new IntersectionObserver(
      ([entry]) => {
        const visible = entry.isIntersecting
        if (visible && !prevHeroVisible) {
          heroLanding = true
          clearTimeout(landingTimer)
          landingTimer = setTimeout(() => {
            heroLanding = false
          }, 500)
        }
        prevHeroVisible = visible
        heroVisible = visible
      },
      { threshold: 0, rootMargin: `-${56}px 0px 0px 0px` },
    )
    observer.observe(node)
    return () => {
      observer.disconnect()
      clearTimeout(landingTimer)
    }
  }

  function scrollTo(id: string) {
    mobileMenuOpen = false
    if (page !== 'home') {
      page = 'home'
      setTimeout(() => {
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
      }, 50)
    } else {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
    }
  }

  function fireBuilderToast() {
    const options: GooeyToastOptions = {}
    if (bHasDesc && bDesc) options.description = bDesc
    if (bHasAction && bActionLabel) {
      options.action = { label: bActionLabel, onClick: () => {}, successLabel: 'Done!' }
    }
    if (bFillColor !== '#ffffff') options.fillColor = bFillColor
    if (bHasBorder && bBorderColor) {
      options.borderColor = bBorderColor
      options.borderWidth = bBorderWidth
    }
    if (bDisplayDuration !== 4000) {
      options.timing = { displayDuration: bDisplayDuration }
    }
    if (bPreset) {
      options.preset = bPreset
    } else {
      if (!bSpring) options.spring = false
      options.bounce = bBounce
    }
    if (bShowProgress) options.showProgress = true
    if (!bShowTimestamp) options.showTimestamp = false

    if (bType === 'default') gooeyToast(bTitle, options)
    else gooeyToast[bType](bTitle, options)
  }

  const generatedCode = $derived.by(() => {
    const lines: string[] = []
    const hasFill = bFillColor !== '#ffffff'
    const hasBorder = bHasBorder && bBorderColor
    const hasPreset = bPreset != null
    const hasSpringOff = !hasPreset && !bSpring
    const hasBounce = !hasPreset && bBounce !== 0.4
    const hasOpts =
      bHasDesc ||
      bHasAction ||
      hasFill ||
      hasBorder ||
      hasPreset ||
      hasSpringOff ||
      hasBounce ||
      bShowProgress ||
      !bShowTimestamp
    const call = bType === 'default' ? 'gooeyToast' : `gooeyToast.${bType}`

    const toasterProps = [`position="${bPosition}"`]
    if (bTheme !== 'light') toasterProps.push(`theme="${bTheme}"`)
    if (bShowProgress) toasterProps.push('showProgress')
    if (!bCloseOnEscape) toasterProps.push('closeOnEscape={false}')
    if (bCloseButton === true) toasterProps.push('closeButton')
    else if (bCloseButton === 'top-left') toasterProps.push('closeButton="top-left"')
    else if (bCloseButton === 'top-right') toasterProps.push('closeButton="top-right"')
    lines.push(`<GooeyToaster ${toasterProps.join(' ')} />`)
    lines.push('')
    if (!hasOpts) {
      lines.push(`${call}('${bTitle}')`)
    } else {
      lines.push(`${call}('${bTitle}', {`)
      if (bHasDesc && bDesc) lines.push(`  description: '${bDesc}',`)
      if (bHasAction && bActionLabel) {
        lines.push(`  action: {`)
        lines.push(`    label: '${bActionLabel}',`)
        lines.push(`    onClick: () => {},`)
        lines.push(`  },`)
      }
      if (hasFill) lines.push(`  fillColor: '${bFillColor}',`)
      if (hasBorder) {
        lines.push(`  borderColor: '${bBorderColor}',`)
        lines.push(`  borderWidth: ${bBorderWidth},`)
      }
      if (hasPreset) lines.push(`  preset: '${bPreset}',`)
      if (hasSpringOff) lines.push(`  spring: false,`)
      if (hasBounce) lines.push(`  bounce: ${bBounce},`)
      if (bShowProgress) lines.push(`  showProgress: true,`)
      if (!bShowTimestamp) lines.push(`  showTimestamp: false,`)
      if (bDisplayDuration !== 4000) {
        lines.push(`  timing: {`)
        lines.push(`    displayDuration: ${bDisplayDuration},`)
        lines.push(`  },`)
      }
      lines.push(`})`)
    }
    return lines.join('\n')
  })

  function fireUpdateToast(icon: Snippet) {
    const id = gooeyToast('Uploading...', { ...DEMO_DEFAULTS, icon })
    setTimeout(() => {
      gooeyToast.update(id, {
        title: 'Upload complete!',
        type: 'success',
        icon: null,
        description: 'Your file has been uploaded and processed.',
      })
    }, 2000)
  }

  function fireCustomDescription(desc: Snippet) {
    gooeyToast.success('Deployment complete', {
      ...DEMO_DEFAULTS,
      description: desc,
    })
  }
</script>

{#snippet GithubIcon(size = 16)}
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path
      d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"
    />
  </svg>
{/snippet}

{#snippet NpmIcon(size = 16)}
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path
      d="M1.763 0C.786 0 0 .786 0 1.763v20.474C0 23.214.786 24 1.763 24h20.474c.977 0 1.763-.786 1.763-1.763V1.763C24 .786 23.214 0 22.237 0zM5.13 5.323l13.837.019-.009 13.836h-3.464l.01-10.382h-3.456L12.04 19.17H5.113z"
    />
  </svg>
{/snippet}

{#snippet CopyIcon()}
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
{/snippet}

{#snippet CheckIcon()}
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2.5"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <polyline points="20 6 9 17 4 12" />
  </svg>
{/snippet}

{#snippet MenuIcon()}
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
    <line x1="3" y1="6" x2="21" y2="6" />
    <line x1="3" y1="12" x2="21" y2="12" />
    <line x1="3" y1="18" x2="21" y2="18" />
  </svg>
{/snippet}

{#snippet CloseIcon()}
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
{/snippet}

{#snippet ArrowLeftIcon()}
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <line x1="19" y1="12" x2="5" y2="12" />
    <polyline points="12 19 5 12 12 5" />
  </svg>
{/snippet}

{#snippet deploymentDesc()}
  <div style="display: flex; flex-direction: column; gap: 10px; min-width: 300px;">
    <div style="display: flex; justify-content: space-between; font-size: 12px;">
      <span style="color: #888;">Environment</span>
      <span style="font-weight: 600;">Production</span>
    </div>
    <div style="display: flex; justify-content: space-between; font-size: 12px;">
      <span style="color: #888;">Branch</span>
      <span style="font-weight: 600;">main @ 3f8a2c1</span>
    </div>
    <div style="display: flex; justify-content: space-between; font-size: 12px;">
      <span style="color: #888;">Duration</span>
      <span style="font-weight: 600;">2m 14s</span>
    </div>
    <div style="height: 1px; background: #e5e5e5;"></div>
    <div style="font-size: 11px; color: #888;">https://my-app.vercel.app</div>
  </div>
{/snippet}

{#snippet spinIcon()}
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2.5"
    stroke-linecap="round"
    stroke-linejoin="round"
    style="animation: gooey-spin 1s linear infinite;"
  >
    <path d="M21 12a9 9 0 1 1-6.22-8.56" />
  </svg>
{/snippet}

<GooeyToaster
  position={bPosition}
  theme={bTheme}
  showProgress={bShowProgress}
  closeOnEscape={bCloseOnEscape}
  closeButton={bCloseButton}
/>

<!-- Header -->
<header class={`site-header${!heroVisible && page === 'home' ? ' header--hero-hidden' : ''}`}>
  <div class="header-inner">
    <button
      class="header-logo"
      onclick={() => setPage('home')}
    >
      gooey-toast
      <img src="/mascot.png" alt="" class="header-mascot" />
    </button>

    <nav class="header-nav">
      <button class="nav-link" onclick={() => scrollTo('examples')}>Examples</button>
      <button class="nav-link" onclick={() => scrollTo('builder')}>Builder</button>
      <button class="nav-link" onclick={() => scrollTo('docs')}>Docs</button>
      <button
        class={`nav-link${page === 'changelog' ? ' nav-link--active' : ''}`}
        onclick={() => setPage('changelog')}
      >
        Changelog
      </button>
    </nav>

    <div class="header-icons">
      <a
        href="https://github.com/Mnichus3142/goey-toast-svelte"
        target="_blank"
        rel="noopener noreferrer"
        class="header-icon-link"
        aria-label="GitHub"
      >
        {@render GithubIcon(18)}
      </a>
      <a
        href="https://www.npmjs.com/package/goey-toast-svelte"
        target="_blank"
        rel="noopener noreferrer"
        class="header-icon-link"
        aria-label="npm"
      >
        {@render NpmIcon(18)}
      </a>
    </div>

    <button
      class="mobile-menu-btn"
      onclick={() => {
        mobileMenuOpen = !mobileMenuOpen
      }}
      aria-label="Menu"
    >
      {#if mobileMenuOpen}
        {@render CloseIcon()}
      {:else}
        {@render MenuIcon()}
      {/if}
    </button>
  </div>

  {#if mobileMenuOpen}
    <div class="mobile-menu">
      <button class="mobile-menu-link" onclick={() => scrollTo('examples')}>Examples</button>
      <button class="mobile-menu-link" onclick={() => scrollTo('builder')}>Builder</button>
      <button class="mobile-menu-link" onclick={() => scrollTo('docs')}>Docs</button>
      <button
        class={`mobile-menu-link${page === 'changelog' ? ' mobile-menu-link--active' : ''}`}
        onclick={() => setPage('changelog')}
      >
        Changelog
      </button>
      <div class="mobile-menu-divider"></div>
      <div class="mobile-menu-icons">
        <a
          href="https://github.com/Mnichus3142/goey-toast-svelte"
          target="_blank"
          rel="noopener noreferrer"
          class="header-icon-link"
        >
          {@render GithubIcon(18)} GitHub
        </a>
        <a
          href="https://www.npmjs.com/package/goey-toast-svelte"
          target="_blank"
          rel="noopener noreferrer"
          class="header-icon-link"
        >
          {@render NpmIcon(18)} npm
        </a>
      </div>
    </div>
  {/if}
</header>

{#if page === 'changelog'}
  <!-- Changelog Page -->
  <div class="page-changelog">
    <button
      class="back-link"
      onclick={() => setPage('home')}
    >
      {@render ArrowLeftIcon()} Back to home
    </button>

    <div class="changelog-header">
      <h1>Changelog</h1>
      <p>What's new in gooey-toast.</p>
    </div>

    <div class="changelog-entry">
      <div class="changelog-version">
        <span class="changelog-tag">v0.5.0</span>
        <span class="changelog-date">Jun 8, 2026</span>
      </div>
      <div class="changelog-body">
        <h4>AI Agent Skill &amp; CLI</h4>
        <ul>
          <li>
            Bundled Agent Skill (<code>SKILL.md</code>) so coding agents (Claude Code, Cursor, etc.)
            install and use goey-toast-svelte correctly — <code>npx skills add Mnichus3142/goey-toast-svelte</code> via
            <a href="https://www.skills.sh/" target="_blank" rel="noreferrer">skills.sh</a>
          </li>
          <li>
            New <code>goey-toast-svelte</code> CLI: <code>npx goey-toast-svelte add-skill</code> with
            <code>--agents</code> and <code>--dir</code> flags, plus <code>print-skill</code>
          </li>
          <li>Added "AI Agents &amp; Skills" docs section to this site and the README</li>
        </ul>
      </div>
    </div>

    <div class="changelog-entry">
      <div class="changelog-version">
        <span class="changelog-tag">v0.4.1</span>
        <span class="changelog-date">Jun 8, 2026</span>
      </div>
      <div class="changelog-body">
        <h4>Global Timestamp Config & Stack Hover Fixes</h4>
        <ul>
          <li>
            Global <code>showTimestamp</code> prop on <code>GooeyToaster</code> to toggle timestamps
            for all toasts (per-toast override still wins)
          </li>
          <li>
            Fixed snap/flash when hovering a multi-toast stack — offsets now sync before paint for
            smooth eased motion
          </li>
          <li>Expanded stack transitions honor <code>prefers-reduced-motion</code></li>
          <li>
            Fixed toast title descenders (<code>g</code>, <code>y</code>, <code>p</code>,
            <code>q</code>) being clipped at the bottom
          </li>
        </ul>
      </div>
    </div>

    <div class="changelog-entry">
      <div class="changelog-version">
        <span class="changelog-tag">v0.4.0</span>
        <span class="changelog-date">Mar 29, 2026</span>
      </div>
      <div class="changelog-body">
        <h4>Close Button, Timestamp Toggle & Fixes</h4>
        <ul>
          <li>
            Close button with <code>closeButton</code> prop — supports <code>top-left</code> and
            <code>top-right</code> positions
          </li>
          <li>Close button inherits toast border/fill styling with shadow fallback</li>
          <li>
            Close button supports hover scale animation, dark mode, and keyboard/touch accessibility
          </li>
          <li>
            Optional <code>showTimestamp</code> prop to show/hide timestamp per toast (default
            <code>true</code>)
          </li>
          <li>
            Backward-compatible export aliases for v0.2.x users (<code>GoeyToaster</code>,
            <code>goeyToast</code>)
          </li>
          <li>Fixed ESM export broken in v0.3.0</li>
          <li>Fixed center toast positioning on mobile viewports</li>
          <li>Fixed toast header stretching full width regression</li>
          <li>Fixed swipe-to-dismiss for compact toasts</li>
          <li>Close button and timestamp toggle added to interactive builder</li>
        </ul>
      </div>
    </div>

    <div class="changelog-entry">
      <div class="changelog-version">
        <span class="changelog-tag">v0.3.0</span>
        <span class="changelog-date">Feb 26, 2026</span>
      </div>
      <div class="changelog-body">
        <h4>Accessibility, Presets, Dark Mode & More</h4>
        <ul>
          <li>Named animation presets: <code>smooth</code>, <code>bouncy</code>, <code>subtle</code>, <code>snappy</code></li>
          <li>Swipe-to-dismiss touch gesture support for mobile devices</li>
          <li>ARIA live region announcements for screen reader accessibility</li>
          <li>SSR compatibility with isomorphic layout effects</li>
          <li>Performance: memoized SVG morph paths and debounced height sync</li>
          <li>Escape key dismiss with <code>closeOnEscape</code> prop (default on)</li>
          <li>
            Toast update API: <code>gooeyToast.update(id, options)</code> for in-place updates
            (supports icon override)
          </li>
          <li>Dark mode theme support via <code>theme</code> prop</li>
          <li>Dismiss by type: <code>gooeyToast.dismiss({'{ type }'})</code> filter</li>
          <li>Progress countdown bar with <code>showProgress</code> prop and hover pause</li>
          <li>Re-expand on hover after progress bar completes with animation reset</li>
          <li>Timestamp display on toasts (local time with seconds)</li>
          <li>Max queue overflow control: <code>maxQueue</code> and <code>queueOverflow</code> props</li>
          <li><code>onDismiss</code> and <code>onAutoClose</code> callback support</li>
          <li>Softer collapse bounce to prevent text clipping</li>
          <li>Wider expanded toast body (300px min-width)</li>
          <li>Fixed promise toast test failures (queue state reset)</li>
          <li>Preset selector in interactive builder</li>
        </ul>
      </div>
    </div>

    <div class="changelog-entry">
      <div class="changelog-version">
        <span class="changelog-tag">v0.2.1</span>
        <span class="changelog-date">Feb 24, 2026</span>
      </div>
      <div class="changelog-body">
        <h4>Queue System & Stability</h4>
        <ul>
          <li>Toast queue system limiting concurrent toasts to <code>visibleToasts</code> (default 3)</li>
          <li>FIFO queue processing when slots open up</li>
          <li>Fixed stacked toast hover spacing and dismiss reliability</li>
          <li>Correct <code>sideEffects</code> in package.json for CSS tree-shaking</li>
        </ul>
      </div>
    </div>

    <div class="changelog-entry">
      <div class="changelog-version">
        <span class="changelog-tag">v0.2.0</span>
        <span class="changelog-date">Feb 15, 2026</span>
      </div>
      <div class="changelog-body">
        <h4>Center Positions & Hover Interactions</h4>
        <ul>
          <li>Center position support: <code>top-center</code> and <code>bottom-center</code></li>
          <li>Hover pause and re-expand on collapsed toasts</li>
          <li>New <code>bounce</code> prop for spring intensity control (0.05–0.8)</li>
          <li>Simplified timing API (removed fine-tuning timing props)</li>
          <li>Fixed center position spring overshoot jiggle</li>
          <li>Fixed action success morph-back and hover re-expand</li>
          <li>Fixed hover spring loop and center morph collapse</li>
          <li>Vercel Web Analytics integration</li>
        </ul>
      </div>
    </div>

    <div class="changelog-entry">
      <div class="changelog-version">
        <span class="changelog-tag">v0.1.5</span>
        <span class="changelog-date">Feb 15, 2026</span>
      </div>
      <div class="changelog-body">
        <h4>Squish Animations & Builder</h4>
        <ul>
          <li>New <code>squishDelay</code> timing prop for more satisfying liquid feel</li>
          <li>Improved bounce animations for a gooeier effect</li>
          <li>Simplified interactive builder in demo</li>
        </ul>
      </div>
    </div>

    <div class="changelog-entry">
      <div class="changelog-version">
        <span class="changelog-tag">v0.1.3</span>
        <span class="changelog-date">Feb 14, 2026</span>
      </div>
      <div class="changelog-body">
        <h4>Spring Animations & Registry</h4>
        <ul>
          <li>Spring option to enable/disable bounce animations</li>
          <li>shadcn/ui registry support</li>
          <li>Fixed CSS modules not working in npm build</li>
          <li>Fixed DTS build with <code>@types/node</code></li>
        </ul>
      </div>
    </div>

    <div class="changelog-entry">
      <div class="changelog-version">
        <span class="changelog-tag">v0.1.1</span>
        <span class="changelog-date">Feb 14, 2026</span>
      </div>
      <div class="changelog-body">
        <h4>Squish Effects & Polish</h4>
        <ul>
          <li>Gooey squish effects: landing bounce, expand/collapse blob squish</li>
          <li>Elastic spring on header squish during expand/collapse</li>
          <li>Dynamic springs, pill resize squish, error shake</li>
          <li>Skip pill resize squish when toast is about to expand (promise resolve/reject)</li>
          <li>Demo site with Vercel deployment and OG image</li>
        </ul>
      </div>
    </div>

    <div class="changelog-entry">
      <div class="changelog-version">
        <span class="changelog-tag">v0.1.0</span>
        <span class="changelog-date">Feb 14, 2026</span>
      </div>
      <div class="changelog-body">
        <h4>Initial Release</h4>
        <ul>
          <li>Organic blob morph animation (pill to blob and back)</li>
          <li>Five toast types: default, success, error, warning, info</li>
          <li>Description body with string or snippet/component support</li>
          <li>Action button with optional success label morph-back</li>
          <li>Promise toasts with loading to success/error transitions</li>
          <li>Configurable display duration and animation timings</li>
          <li>Custom fill color, border color, and border width</li>
          <li>CSS class overrides via <code>classNames</code> prop</li>
          <li>Built on svelte-sonner and Motion</li>
        </ul>
      </div>
    </div>
  </div>
{:else}
  <!-- Home Page -->
  <!-- Hero -->
  <div class="hero">
    <div class="hero-badge">
      <span></span> v0.5.0
    </div>
    <h1 {@attach observeHeroTitle} class={heroLanding ? 'hero-title--landing' : ''}>
      gooey-toast
      <img
        src="/mascot.png"
        alt="mascot"
        class={`hero-mascot${heroLanding ? ' hero-mascot--landing' : ''}`}
      />
    </h1>
    <p class="hero-description">
      Morphing toast notifications for Svelte. Organic blob animations, promise tracking, and full
      customization out of the box.
    </p>
    <div class="hero-install">
      <div class="install-wrapper">
        <code><span class="prompt">$</span> npm install goey-toast-svelte</code>
        <button class="copy-btn" onclick={() => copyText('npm install goey-toast-svelte', 'install')}>
          {#if installCopied}
            {@render CheckIcon()}
          {:else}
            {@render CopyIcon()}
          {/if}
        </button>
      </div>
      <a
        href="https://www.buymeacoffee.com/gxWiwwHU0P"
        target="_blank"
        rel="noopener noreferrer"
        style="display: inline-flex; align-items: center; gap: 8px; padding: 0 16px; font-size: 15px; font-weight: 700; font-family: Cookie, cursive; background: #FFDD00; color: #000; border-radius: var(--radius-sm); text-decoration: none; line-height: 1; align-self: stretch; transition: transform 0.15s ease;"
        onmouseenter={(e) => {
          e.currentTarget.style.transform = 'scale(1.05)'
        }}
        onmouseleave={(e) => {
          e.currentTarget.style.transform = ''
        }}
      >
        <img src="https://cdn.buymeacoffee.com/buttons/bmc-new-btn-logo.svg" alt="" width="20" height="28" />
        <span>Buy me a coffee</span>
      </a>
      <span class="install-hint">(yes, one "o" — the extra goo is already inside)</span>
    </div>
  </div>

  <!-- Main two-column area -->
  <div class="two-col" id="examples">
    <!-- Quick-fire examples -->
    <div class="examples">
      <div class="examples-header">
        <h2>Examples</h2>
        <span>Click to preview</span>
      </div>

      <div class="section">
        <div class="section-label">Toast Types</div>
        <div class="buttons">
          <button onclick={() => gooeyToast('Notification received', DEMO_DEFAULTS)}>Default</button>
          <button onclick={() => gooeyToast.success('Changes Saved', DEMO_DEFAULTS)}>Success</button>
          <button onclick={() => gooeyToast.error('Something went wrong', DEMO_DEFAULTS)}>Error</button>
          <button onclick={() => gooeyToast.warning('Storage is almost full', DEMO_DEFAULTS)}>Warning</button>
          <button onclick={() => gooeyToast.info('New update available', DEMO_DEFAULTS)}>Info</button>
        </div>
      </div>

      <div class="section">
        <div class="section-label">With Description</div>
        <div class="buttons">
          <button
            onclick={() =>
              gooeyToast.warning('Your session is about to expire', {
                ...DEMO_DEFAULTS,
                description:
                  "You've been inactive for 25 minutes. Please save your work or your session will end automatically.",
              })}
          >
            Warning + Description
          </button>
          <button
            onclick={() =>
              gooeyToast.error('Connection lost', {
                ...DEMO_DEFAULTS,
                description: 'Unable to reach the server. Check your internet connection and try again.',
              })}
          >
            Error + Description
          </button>
        </div>
      </div>

      <div class="section">
        <div class="section-label">With Action Button</div>
        <div class="buttons">
          <button
            onclick={() =>
              gooeyToast.error('Payment failed', {
                ...DEMO_DEFAULTS,
                description:
                  'Your card ending in 4242 was declined. Please update your payment method to continue.',
                action: {
                  label: 'Update Payment',
                  onClick: () => gooeyToast.success('Redirecting...', DEMO_DEFAULTS),
                },
              })}
          >
            Error + Action
          </button>
          <button
            onclick={() =>
              gooeyToast.info('Share link ready', {
                ...DEMO_DEFAULTS,
                description: 'Your share link has been generated and is ready to copy.',
                action: {
                  label: 'Copy to Clipboard',
                  onClick: () => navigator.clipboard.writeText('https://example.com/share/abc123'),
                  successLabel: 'Copied!',
                },
              })}
          >
            Action + Success Pill
          </button>
        </div>
      </div>

      <div class="section">
        <div class="section-label">Custom Component Body</div>
        <div class="buttons">
          <button onclick={() => fireCustomDescription(deploymentDesc)}>Snippet Description</button>
        </div>
      </div>

      <div class="section">
        <div class="section-label">No Spring (Smooth Easing)</div>
        <div class="buttons">
          <button onclick={() => gooeyToast.success('Changes Saved', { ...DEMO_DEFAULTS, spring: false })}
            >Success (no spring)</button
          >
          <button
            onclick={() =>
              gooeyToast.error('Connection lost', {
                ...DEMO_DEFAULTS,
                spring: false,
                description: 'Unable to reach the server. Check your internet connection and try again.',
              })}
          >
            Error + Desc (no spring)
          </button>
          <button
            onclick={() =>
              gooeyToast.info('Share link ready', {
                ...DEMO_DEFAULTS,
                spring: false,
                description: 'Your share link has been generated and is ready to copy.',
                action: {
                  label: 'Copy to Clipboard',
                  onClick: () => navigator.clipboard.writeText('https://example.com/share/abc123'),
                  successLabel: 'Copied!',
                },
              })}
          >
            Action (no spring)
          </button>
        </div>
      </div>

      <div class="section">
        <div class="section-label">Promise (Morph Animation)</div>
        <div class="buttons">
          <button
            onclick={() =>
              gooeyToast.promise(sleep(2000), {
                ...DEMO_DEFAULTS,
                loading: 'Saving...',
                success: 'Changes Saved',
                error: 'Something went wrong',
              })}
          >
            Promise + Success (pill)
          </button>
          <button
            onclick={() =>
              gooeyToast.promise(failAfter(2000), {
                ...DEMO_DEFAULTS,
                loading: 'Saving...',
                success: 'Changes Saved',
                error: 'Something went wrong',
              })}
          >
            Promise + Error (pill)
          </button>
          <button
            onclick={() =>
              gooeyToast.promise(failAfter(2000), {
                ...DEMO_DEFAULTS,
                loading: 'Uploading file...',
                success: 'Upload complete',
                error: 'Upload failed',
                description: {
                  error:
                    "You've used 95% of your available storage. Please upgrade and plan to continue.",
                },
                action: {
                  error: {
                    label: 'Action Button',
                    onClick: () => gooeyToast.info('Retrying...', DEMO_DEFAULTS),
                  },
                },
              })}
          >
            Promise + Error (expanded)
          </button>
          <button
            onclick={() =>
              gooeyToast.promise(sleep(2000), {
                ...DEMO_DEFAULTS,
                loading: 'Processing...',
                success: 'All done!',
                error: 'Failed',
                description: {
                  success: 'Your data has been processed and saved successfully.',
                },
              })}
          >
            Promise + Success (expanded)
          </button>
        </div>
      </div>

      <div class="section">
        <div class="section-label">Update Toast</div>
        <div class="buttons">
          <button onclick={() => fireUpdateToast(spinIcon)}>Update Toast</button>
        </div>
      </div>

      <div class="section">
        <div class="section-label">Progress Bar</div>
        <div class="buttons">
          <button
            onclick={() =>
              gooeyToast.info('Downloading update...', {
                ...DEMO_DEFAULTS,
                description: 'This may take a moment.',
                showProgress: true,
              })}
          >
            Progress Bar
          </button>
        </div>
      </div>

      <div class="section">
        <div class="section-label">Callbacks</div>
        <div class="buttons">
          <button
            onclick={() =>
              gooeyToast.info('Watch me disappear', {
                ...DEMO_DEFAULTS,
                onDismiss: () => {
                  gooeyToast.success('Previous toast dismissed!', DEMO_DEFAULTS)
                },
              })}
          >
            With Callback
          </button>
        </div>
      </div>
    </div>

    <!-- Interactive Builder -->
    <div class="builder" id="builder">
      <div class="builder-header">
        <h2>Builder</h2>
        <p>Design and test your toast in real time.</p>
      </div>

      <div class="builder-card">
        <!-- Position -->
        <div class="builder-row">
          <div class="builder-label">Position</div>
          <div class="type-pills">
            {#each POSITIONS as p (p)}
              <button
                class="type-pill"
                data-type="position"
                data-active={bPosition === p}
                onclick={() => {
                  bPosition = p
                }}
              >
                {p}
              </button>
            {/each}
          </div>
        </div>

        <!-- Type -->
        <div class="builder-row">
          <div class="builder-label">Type</div>
          <div class="type-pills">
            {#each TOAST_TYPES as t (t)}
              <button
                class="type-pill"
                data-type={t}
                data-active={bType === t}
                onclick={() => {
                  bType = t
                }}
              >
                {t}
              </button>
            {/each}
          </div>
        </div>

        <!-- Title -->
        <div class="builder-row">
          <div class="builder-label">Title</div>
          <input class="builder-input" bind:value={bTitle} placeholder="Toast title..." />
        </div>

        <!-- Description toggle + input -->
        <div class="builder-row">
          <div class="toggle-row">
            <span class="toggle-row-label">Description</span>
            <button
              class="toggle"
              aria-label="Toggle description"
              data-on={bHasDesc}
              onclick={() => {
                bHasDesc = !bHasDesc
              }}
            >
              <div class="toggle-knob"></div>
            </button>
          </div>
          {#if bHasDesc}
            <textarea
              class="builder-input"
              style="margin-top: 10px;"
              bind:value={bDesc}
              placeholder="Description text..."
            ></textarea>
          {/if}
        </div>

        <!-- Action toggle + input -->
        <div class="builder-row">
          <div class="toggle-row">
            <span class="toggle-row-label">Action Button</span>
            <button
              class="toggle"
              aria-label="Toggle action button"
              data-on={bHasAction}
              onclick={() => {
                bHasAction = !bHasAction
              }}
            >
              <div class="toggle-knob"></div>
            </button>
          </div>
          {#if bHasAction}
            <input
              class="builder-input"
              style="margin-top: 10px;"
              bind:value={bActionLabel}
              placeholder="Button label..."
            />
          {/if}
        </div>

        <!-- Style -->
        <div class="builder-row">
          <div class="builder-label">Style</div>
          <div class="style-controls">
            <div class="color-row">
              <span class="color-row-label">Fill Color</span>
              <div class="color-picker-group">
                <input type="color" class="color-input" bind:value={bFillColor} />
                <input class="builder-input color-hex" bind:value={bFillColor} placeholder="#ffffff" />
              </div>
            </div>
            <div class="border-section">
              <div class="toggle-row">
                <span class="toggle-row-label">Border</span>
                <button
                  class="toggle"
                  aria-label="Toggle border"
                  data-on={bHasBorder}
                  onclick={() => {
                    bHasBorder = !bHasBorder
                  }}
                >
                  <div class="toggle-knob"></div>
                </button>
              </div>
              {#if bHasBorder}
                <div class="border-controls">
                  <div class="color-row">
                    <span class="color-row-label">Color</span>
                    <div class="color-picker-group">
                      <input type="color" class="color-input" bind:value={bBorderColor} />
                      <input
                        class="builder-input color-hex"
                        bind:value={bBorderColor}
                        placeholder="#E0E0E0"
                      />
                    </div>
                  </div>
                  <div class="slider-item">
                    <div class="slider-item-header">
                      <span class="slider-item-label">Width</span>
                      <span class="slider-item-value">{bBorderWidth}px</span>
                    </div>
                    <input
                      type="range"
                      class="slider"
                      min={0.5}
                      max={4}
                      step={0.5}
                      bind:value={bBorderWidth}
                    />
                  </div>
                </div>
              {/if}
            </div>
          </div>
        </div>

        <!-- Timing sliders -->
        <div class="builder-row">
          <div class="builder-label">Timing</div>
          <div class="slider-group">
            <div class="slider-item">
              <div class="slider-item-header">
                <span class="slider-item-label">Display Duration</span>
                <span class="slider-item-value">{(bDisplayDuration / 1000).toFixed(1)}s</span>
              </div>
              <input
                type="range"
                class="slider"
                min={1000}
                max={20000}
                step={500}
                bind:value={bDisplayDuration}
              />
            </div>
          </div>
        </div>

        <!-- Animation Preset -->
        <div class="builder-row">
          <div class="builder-label">Animation Preset</div>
          <div class="type-pills">
            {#each PRESET_NAMES as p (p)}
              <button
                class="type-pill"
                data-type="position"
                data-active={bPreset === p}
                onclick={() => {
                  if (bPreset === p) {
                    bPreset = null
                  } else {
                    bPreset = p
                    const cfg = animationPresets[p]
                    bSpring = cfg.spring
                    bBounce = cfg.bounce
                  }
                }}
              >
                {p}
              </button>
            {/each}
          </div>
        </div>

        <!-- Spring Effect -->
        <div class="builder-row">
          <div class="builder-label">Spring Effect</div>
          <div class="slider-group">
            <div class="slider-item">
              <div class="slider-item-header">
                <span class="slider-item-label"
                  >{bSpring ? `Bounce: ${bBounce.toFixed(2)}` : 'Off'}</span
                >
                <button
                  class="toggle"
                  aria-label="Toggle spring effect"
                  data-on={bSpring}
                  onclick={() => {
                    bSpring = !bSpring
                    bPreset = null
                  }}
                  style="transform: scale(0.85);"
                >
                  <div class="toggle-knob"></div>
                </button>
              </div>
              {#if bSpring}
                <input
                  type="range"
                  class="slider"
                  min={0.05}
                  max={0.8}
                  step={0.05}
                  value={bBounce}
                  oninput={(e) => {
                    bBounce = Number(e.currentTarget.value)
                    bPreset = null
                  }}
                />
              {/if}
            </div>
          </div>
        </div>

        <!-- Theme -->
        <div class="builder-row">
          <div class="builder-label">Theme</div>
          <div class="type-pills">
            {#each ['light', 'dark'] as t (t)}
              <button
                class="type-pill"
                data-type="position"
                data-active={bTheme === t}
                onclick={() => {
                  bTheme = t as 'light' | 'dark'
                }}
              >
                {t}
              </button>
            {/each}
          </div>
        </div>

        <!-- Show Progress -->
        <div class="builder-row">
          <div class="toggle-row">
            <span class="toggle-row-label">Show Progress</span>
            <button
              class="toggle"
              aria-label="Toggle progress bar"
              data-on={bShowProgress}
              onclick={() => {
                bShowProgress = !bShowProgress
              }}
            >
              <div class="toggle-knob"></div>
            </button>
          </div>
        </div>

        <!-- Close on Escape -->
        <div class="builder-row">
          <div class="toggle-row">
            <span class="toggle-row-label">Close on Escape</span>
            <button
              class="toggle"
              aria-label="Toggle close on escape"
              data-on={bCloseOnEscape}
              onclick={() => {
                bCloseOnEscape = !bCloseOnEscape
              }}
            >
              <div class="toggle-knob"></div>
            </button>
          </div>
        </div>

        <!-- Show Timestamp -->
        <div class="builder-row">
          <div class="toggle-row">
            <span class="toggle-row-label">Show Timestamp</span>
            <button
              class="toggle"
              aria-label="Toggle timestamp"
              data-on={bShowTimestamp}
              onclick={() => {
                bShowTimestamp = !bShowTimestamp
              }}
            >
              <div class="toggle-knob"></div>
            </button>
          </div>
        </div>

        <!-- Close Button -->
        <div class="builder-row">
          <div class="toggle-row">
            <span class="toggle-row-label">Close Button</span>
            <button
              class="toggle"
              aria-label="Toggle close button"
              data-on={bCloseButton !== false}
              onclick={() => {
                bCloseButton = bCloseButton === false ? 'top-left' : false
              }}
            >
              <div class="toggle-knob"></div>
            </button>
          </div>
        </div>
        {#if bCloseButton !== false}
          <div class="builder-row">
            <div class="builder-label">Close Button Position</div>
            <div class="type-pills">
              {#each ['top-left', 'top-right'] as pos (pos)}
                <button
                  class="type-pill"
                  data-type="position"
                  data-active={bCloseButton === pos}
                  onclick={() => {
                    bCloseButton = pos as 'top-left' | 'top-right'
                  }}
                >
                  {pos}
                </button>
              {/each}
            </div>
          </div>
        {/if}

        <!-- Fire button -->
        <div class="builder-row">
          <button class="fire-btn" onclick={fireBuilderToast}>Fire Toast</button>
        </div>

        <!-- Generated code -->
        <div class="builder-code">
          <button class="code-copy-btn" onclick={() => copyText(generatedCode, 'code')}>
            {codeCopied ? 'Copied!' : 'Copy'}
          </button>
          <pre><code>{generatedCode}</code></pre>
        </div>
      </div>
    </div>
  </div>
  <!-- end two-col -->

  <!-- Documentation -->
  <div class="docs" id="docs">
    <div class="docs-header">
      <h2>Documentation</h2>
      <p>Everything you need to add morphing toast notifications to your Svelte app.</p>
    </div>

    <div class="doc-section">
      <div class="doc-section-label">
        <div class="doc-number">01</div>
        <h3>Quick Start</h3>
      </div>
      <div class="doc-section-content">
        <p>
          Add the <span class="inline-code">GooeyToaster</span> provider and call 
          <span class="inline-code">gooeyToast</span> from anywhere.
        </p>
        <pre><code>{`<script lang="ts">
  import { GooeyToaster, gooeyToast } from 'goey-toast-svelte'
  import 'goey-toast-svelte/styles.css'
</script>

<GooeyToaster position="bottom-right" />
<button onclick={() => gooeyToast.success('Saved!')}>
  Save
</button>`}</code></pre>
        <p>
          Requires <span class="inline-code">svelte</span> and 
          <span class="inline-code">motion</span> as peer dependencies.
        </p>
      </div>
    </div>

    <div class="doc-section">
      <div class="doc-section-label">
        <div class="doc-number">02</div>
        <h3>Install</h3>
      </div>
      <div class="doc-section-content">
        <p>Install the package and import the styles once in your app entry:</p>
        <pre><code>{`npm install goey-toast-svelte

import 'goey-toast-svelte/styles.css'`}</code></pre>
        <p>Then mount the toaster in your root component:</p>
        <pre><code>{`<script lang="ts">
  import { GooeyToaster, gooeyToast } from 'goey-toast-svelte'
</script>

<GooeyToaster />
<!-- Trigger from anywhere -->
<!-- gooeyToast.success('Saved!') -->`}</code></pre>
      </div>
    </div>

    <div class="doc-section">
      <div class="doc-section-label">
        <div class="doc-number">03</div>
        <h3>AI Agents &amp; Skills</h3>
      </div>
      <div class="doc-section-content">
        <p>
          Teach your coding agent (Claude Code, Cursor, etc.) how to install and use goey-toast with a
          bundled <span class="inline-code">SKILL.md</span>. Install it from the 
          <a href="https://www.skills.sh/" target="_blank" rel="noreferrer">skills.sh</a> 
          registry:
        </p>
        <pre><code>npx skills add Mnichus3142/goey-toast-svelte</code></pre>
        <p>Or drop the skill into your project from the package itself:</p>
        <pre><code>{`npx goey-toast-svelte add-skill            # -> .claude/skills/goey-toast/SKILL.md
npx goey-toast-svelte add-skill --agents   # also write an AGENTS.md pointer
npx goey-toast-svelte add-skill --dir .cursor/skills/goey-toast`}</code></pre>
        <p>
          The agent then knows the API, the required 
          <span class="inline-code">&lt;GooeyToaster /&gt;</span> mount, and the 
          <span class="inline-code">styles.css</span> import — so it writes correct toast code on the
          first try.
        </p>
      </div>
    </div>

    <div class="doc-section">
      <div class="doc-section-label">
        <div class="doc-number">04</div>
        <h3>Toast Types</h3>
      </div>
      <div class="doc-section-content">
        <pre><code>{`gooeyToast('Hello')                    // default (neutral)
gooeyToast.success('Saved!')           // green
gooeyToast.error('Failed')             // red
gooeyToast.warning('Careful')          // yellow
gooeyToast.info('FYI')                 // blue`}</code></pre>
        <div class="doc-try-buttons">
          <button onclick={() => gooeyToast('Notification received', DEMO_DEFAULTS)}>Default</button>
          <button onclick={() => gooeyToast.success('Changes Saved', DEMO_DEFAULTS)}>Success</button>
          <button onclick={() => gooeyToast.error('Something went wrong', DEMO_DEFAULTS)}>Error</button>
          <button onclick={() => gooeyToast.warning('Storage is almost full', DEMO_DEFAULTS)}>Warning</button>
          <button onclick={() => gooeyToast.info('New update available', DEMO_DEFAULTS)}>Info</button>
        </div>
      </div>
    </div>

    <div class="doc-section">
      <div class="doc-section-label">
        <div class="doc-number">05</div>
        <h3>Description</h3>
      </div>
      <div class="doc-section-content">
        <p>
          Pass a string or a <span class="inline-code">Snippet</span> / component as the description to
          expand the toast into a blob.
        </p>
        <pre><code>{`gooeyToast.error('Payment failed', {
  description: 'Your card was declined.',
})

{#snippet deployBody()}
  <div>
    <strong>Production</strong>
    <span>main @ 3f8a2c1</span>
  </div>
{/snippet}

gooeyToast.success('Deployed', {
  description: deployBody,
})`}</code></pre>
        <div class="doc-try-buttons">
          <button
            onclick={() =>
              gooeyToast.warning('Your session is about to expire', {
                ...DEMO_DEFAULTS,
                description:
                  "You've been inactive for 25 minutes. Please save your work or your session will end automatically.",
              })}
          >
            Warning + Description
          </button>
          <button
            onclick={() =>
              gooeyToast.error('Connection lost', {
                ...DEMO_DEFAULTS,
                description: 'Unable to reach the server. Check your internet connection and try again.',
              })}
          >
            Error + Description
          </button>
        </div>
      </div>
    </div>

    <div class="doc-section">
      <div class="doc-section-label">
        <div class="doc-number">06</div>
        <h3>Action Button</h3>
      </div>
      <div class="doc-section-content">
        <p>
          Add <span class="inline-code">successLabel</span> for a pill morph-back animation on click.
        </p>
        <pre><code>{`gooeyToast.info('Share link ready', {
  description: 'Your link has been generated.',
  action: {
    label: 'Copy to Clipboard',
    onClick: () => navigator.clipboard.writeText(url),
    successLabel: 'Copied!',   // optional morph-back
  },
})`}</code></pre>
        <div class="doc-try-buttons">
          <button
            onclick={() =>
              gooeyToast.error('Payment failed', {
                ...DEMO_DEFAULTS,
                description:
                  'Your card ending in 4242 was declined. Please update your payment method to continue.',
                action: {
                  label: 'Update Payment',
                  onClick: () => gooeyToast.success('Redirecting...', DEMO_DEFAULTS),
                },
              })}
          >
            Error + Action
          </button>
          <button
            onclick={() =>
              gooeyToast.info('Share link ready', {
                ...DEMO_DEFAULTS,
                description: 'Your share link has been generated and is ready to copy.',
                action: {
                  label: 'Copy to Clipboard',
                  onClick: () => navigator.clipboard.writeText('https://example.com/share/abc123'),
                  successLabel: 'Copied!',
                },
              })}
          >
            Action + Success Pill
          </button>
        </div>
      </div>
    </div>

    <div class="doc-section">
      <div class="doc-section-label">
        <div class="doc-number">07</div>
        <h3>Promise Toasts</h3>
      </div>
      <div class="doc-section-content">
        <p>
          Automatically transitions from loading to success/error when the promise resolves.
        </p>
        <pre><code>{`gooeyToast.promise(saveData(), {
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
})`}</code></pre>
        <div class="doc-try-buttons">
          <button
            onclick={() =>
              gooeyToast.promise(sleep(2000), {
                ...DEMO_DEFAULTS,
                loading: 'Saving...',
                success: 'Changes Saved',
                error: 'Something went wrong',
              })}
          >
            Promise + Success (pill)
          </button>
          <button
            onclick={() =>
              gooeyToast.promise(failAfter(2000), {
                ...DEMO_DEFAULTS,
                loading: 'Saving...',
                success: 'Changes Saved',
                error: 'Something went wrong',
              })}
          >
            Promise + Error (pill)
          </button>
          <button
            onclick={() =>
              gooeyToast.promise(sleep(2000), {
                ...DEMO_DEFAULTS,
                loading: 'Processing...',
                success: 'All done!',
                error: 'Failed',
                description: {
                  success: 'Your data has been processed and saved successfully.',
                },
              })}
          >
            Promise + Success (expanded)
          </button>
        </div>
      </div>
    </div>

    <div class="doc-section">
      <div class="doc-section-label">
        <div class="doc-number">08</div>
        <h3>Timings</h3>
      </div>
      <div class="doc-section-content">
        <p>
          Control how long toasts stay visible with the 
          <span class="inline-code">timing</span> option.
        </p>
        <div class="table-scroll">
          <table class="prop-table">
            <thead>
              <tr>
                <th>Property</th>
                <th>Type</th>
                <th>Default</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>displayDuration</td>
                <td>number</td>
                <td>4000</td>
                <td>Milliseconds toast stays visible</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <div class="doc-section">
      <div class="doc-section-label">
        <div class="doc-number">09</div>
        <h3>Toaster Props</h3>
      </div>
      <div class="doc-section-content">
        <p>
          6 positions supported. Right-side positions auto-mirror the blob horizontally. Center
          positions use a symmetric morph where the body grows outward from the pill.
        </p>
        <pre><code>&lt;GooeyToaster position="top-center" /&gt;</code></pre>
        <div class="table-scroll">
          <table class="prop-table">
            <thead>
              <tr>
                <th>Prop</th>
                <th>Type</th>
                <th>Default</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>position</td>
                <td>string</td>
                <td>'bottom-right'</td>
                <td
                  >6 positions: top-left, top-center, top-right, bottom-left, bottom-center,
                  bottom-right</td
                >
              </tr>
              <tr>
                <td>duration</td>
                <td>number</td>
                <td>—</td>
                <td>Default display duration (ms)</td>
              </tr>
              <tr>
                <td>gap</td>
                <td>number</td>
                <td>14</td>
                <td>Gap between stacked toasts</td>
              </tr>
              <tr>
                <td>offset</td>
                <td>number | string</td>
                <td>'24px'</td>
                <td>Distance from screen edge</td>
              </tr>
              <tr>
                <td>theme</td>
                <td>'light' | 'dark'</td>
                <td>'light'</td>
                <td>Color theme</td>
              </tr>
              <tr>
                <td>spring</td>
                <td>boolean</td>
                <td>true</td>
                <td>Enable spring/bounce animations globally</td>
              </tr>
              <tr>
                <td>bounce</td>
                <td>number</td>
                <td>0.4</td>
                <td>Spring intensity: 0.05 (subtle) to 0.8 (dramatic)</td>
              </tr>
              <tr>
                <td>closeOnEscape</td>
                <td>boolean</td>
                <td>true</td>
                <td>Dismiss most recent toast on Escape key press</td>
              </tr>
              <tr>
                <td>showProgress</td>
                <td>boolean</td>
                <td>false</td>
                <td>Show countdown progress bar on all toasts</td>
              </tr>
              <tr>
                <td>maxQueue</td>
                <td>number</td>
                <td>Infinity</td>
                <td>Maximum number of toasts in the waiting queue</td>
              </tr>
              <tr>
                <td>queueOverflow</td>
                <td>'drop-oldest' | 'drop-newest'</td>
                <td>'drop-oldest'</td>
                <td>Behavior when queue exceeds maxQueue</td>
              </tr>
              <tr>
                <td>swipeToDismiss</td>
                <td>boolean</td>
                <td>true</td>
                <td>Enable swipe-to-dismiss touch gestures on mobile</td>
              </tr>
              <tr>
                <td>preset</td>
                <td>AnimationPresetName</td>
                <td>—</td>
                <td>Named animation preset (smooth, bouncy, subtle, snappy)</td>
              </tr>
              <tr>
                <td>showTimestamp</td>
                <td>boolean</td>
                <td>true</td>
                <td>Show/hide timestamp on all toasts globally</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <div class="doc-section">
      <div class="doc-section-label">
        <div class="doc-number">10</div>
        <h3>Options</h3>
      </div>
      <div class="doc-section-content">
        <div class="table-scroll">
          <table class="prop-table">
            <thead>
              <tr>
                <th>Option</th>
                <th>Type</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>description</td>
                <td>string | Snippet | Component</td>
                <td>Body content (string or custom markup)</td>
              </tr>
              <tr>
                <td>action</td>
                <td>GooeyToastAction</td>
                <td>Action button config</td>
              </tr>
              <tr>
                <td>icon</td>
                <td>string | Snippet | Component | null</td>
                <td>Custom icon override</td>
              </tr>
              <tr>
                <td>duration</td>
                <td>number</td>
                <td>Display duration in ms</td>
              </tr>
              <tr>
                <td>id</td>
                <td>string | number</td>
                <td>Unique toast identifier</td>
              </tr>
              <tr>
                <td>classNames</td>
                <td>GooeyToastClassNames</td>
                <td>CSS class overrides</td>
              </tr>
              <tr>
                <td>fillColor</td>
                <td>string</td>
                <td>Background color of the blob</td>
              </tr>
              <tr>
                <td>borderColor</td>
                <td>string</td>
                <td>Border color of the blob</td>
              </tr>
              <tr>
                <td>borderWidth</td>
                <td>number</td>
                <td>Border width in px (default 1.5)</td>
              </tr>
              <tr>
                <td>timing</td>
                <td>GooeyToastTimings</td>
                <td>Animation timing overrides</td>
              </tr>
              <tr>
                <td>spring</td>
                <td>boolean</td>
                <td>Enable spring/bounce animations (default true)</td>
              </tr>
              <tr>
                <td>bounce</td>
                <td>number</td>
                <td>Spring intensity: 0.05 (subtle) to 0.8 (dramatic), default 0.4</td>
              </tr>
              <tr>
                <td>showProgress</td>
                <td>boolean</td>
                <td>Show countdown progress bar on this toast</td>
              </tr>
              <tr>
                <td>showTimestamp</td>
                <td>boolean</td>
                <td
                  >Show/hide timestamp on this toast; when omitted, inherits
                  <code>GooeyToaster.showTimestamp</code> (default <code>true</code>)</td
                >
              </tr>
              <tr>
                <td>preset</td>
                <td>AnimationPresetName</td>
                <td>Named animation preset (smooth, bouncy, subtle, snappy)</td>
              </tr>
              <tr>
                <td>onDismiss</td>
                <td>(id: string | number) =&gt; void</td>
                <td>Callback fired when toast is dismissed (any reason)</td>
              </tr>
              <tr>
                <td>onAutoClose</td>
                <td>(id: string | number) =&gt; void</td>
                <td>Callback fired only when toast auto-closes (timer)</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <div class="doc-section">
      <div class="doc-section-label">
        <div class="doc-number">11</div>
        <h3>Methods</h3>
      </div>
      <div class="doc-section-content">
        <p>
          Beyond the basic <span class="inline-code">gooeyToast()</span> and type methods, the
          following methods are available for managing toasts programmatically.
        </p>
        <div class="table-scroll">
          <table class="prop-table">
            <thead>
              <tr>
                <th>Method</th>
                <th>Signature</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>gooeyToast.dismiss</td>
                <td>(id?: string | number) =&gt; void</td>
                <td>Dismiss a specific toast by ID, or all toasts if no ID</td>
              </tr>
              <tr>
                <td>gooeyToast.dismiss</td>
                <td>(filter: DismissFilter) =&gt; void</td>
                <td>Dismiss all toasts matching a type filter</td>
              </tr>
              <tr>
                <td>gooeyToast.update</td>
                <td>(id, options: GooeyToastUpdateOptions) =&gt; void</td>
                <td>Update an active toast's title, description, type, or action in place</td>
              </tr>
            </tbody>
          </table>
        </div>
        <h4 style="margin-top: 20px; font-size: 13px;">DismissFilter</h4>
        <pre><code>{`interface DismissFilter {
  type: GooeyToastType | GooeyToastType[]
}

// Dismiss all error toasts
gooeyToast.dismiss({ type: 'error' })

// Dismiss all error and warning toasts
gooeyToast.dismiss({ type: ['error', 'warning'] })`}</code></pre>
        <h4 style="margin-top: 20px; font-size: 13px;">GooeyToastUpdateOptions</h4>
        <pre><code>{`interface GooeyToastUpdateOptions {
  title?: string
  description?: string | Snippet | Component
  type?: GooeyToastType
  action?: GooeyToastAction
}

// Update a toast in place
const id = gooeyToast.success('Uploading...')
gooeyToast.update(id, {
  title: 'Upload complete!',
  type: 'success',
  description: 'File has been processed.',
})`}</code></pre>
      </div>
    </div>

    <div class="doc-section">
      <div class="doc-section-label">
        <div class="doc-number">12</div>
        <h3>Custom Styling</h3>
      </div>
      <div class="doc-section-content">
        <p>
          Override styles for any part of the toast with 
          <span class="inline-code">classNames</span>.
        </p>
        <pre><code>{`gooeyToast.success('Styled!', {
  fillColor: '#1a1a2e',
  borderColor: '#333',
  borderWidth: 2,
  classNames: {
    wrapper: 'my-wrapper',
    title: 'my-title',
    description: 'my-desc',
    actionButton: 'my-btn',
  },
})`}</code></pre>
        <div class="doc-try-buttons">
          <button
            onclick={() =>
              gooeyToast.success('Styled!', {
                ...DEMO_DEFAULTS,
                fillColor: '#1a1a2e',
                borderColor: '#333',
                borderWidth: 2,
                description: 'Custom fill and border styling.',
              })}
          >
            Try Custom Style
          </button>
        </div>
        <div class="table-scroll">
          <table class="prop-table">
            <thead>
              <tr>
                <th>Key</th>
                <th>Target</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>wrapper</td>
                <td>Outer container</td>
              </tr>
              <tr>
                <td>content</td>
                <td>Content area</td>
              </tr>
              <tr>
                <td>header</td>
                <td>Icon + title row</td>
              </tr>
              <tr>
                <td>title</td>
                <td>Title text</td>
              </tr>
              <tr>
                <td>icon</td>
                <td>Icon wrapper</td>
              </tr>
              <tr>
                <td>description</td>
                <td>Body text</td>
              </tr>
              <tr>
                <td>actionWrapper</td>
                <td>Button container</td>
              </tr>
              <tr>
                <td>actionButton</td>
                <td>Action button</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <div class="doc-section">
      <div class="doc-section-label">
        <div class="doc-number">13</div>
        <h3>Spring Animation</h3>
      </div>
      <div class="doc-section-content">
        <p>
          Disable the spring/bounce effect for a cleaner, more subtle animation style. Set per-toast
          or globally on the Toaster.
        </p>
        <pre><code>{`// Per-toast
gooeyToast.success('Saved', {
  description: 'Your changes have been synced.',
  spring: false,
})

// Global default
<GooeyToaster spring={false} />`}</code></pre>
        <p>
          When <span class="inline-code">spring</span> is 
          <span class="inline-code">false</span>, all spring-based animations (landing squish, blob
          morph, pill resize, header squish) use smooth ease-in-out curves instead. Error shake still
          works regardless. Per-toast values override the global setting.
        </p>
        <div class="doc-try-buttons">
          <button
            onclick={() => gooeyToast.success('Smooth save', { ...DEMO_DEFAULTS, spring: false })}
          >
            No Spring (pill)
          </button>
          <button
            onclick={() =>
              gooeyToast.warning('Storage warning', {
                ...DEMO_DEFAULTS,
                spring: false,
                description: 'You are using 95% of your available storage.',
              })}
          >
            No Spring (expanded)
          </button>
          <button
            onclick={() => gooeyToast.success('Bouncy save', { ...DEMO_DEFAULTS, spring: true })}
          >
            With Spring (compare)
          </button>
        </div>
      </div>
    </div>
  </div>
{/if}

<!-- Footer -->
<footer class="site-footer">
  <p>
    Also check out 
    <a href="https://gooey-search-tabs.vercel.app" target="_blank" rel="noopener noreferrer"
      >gooey-search-tabs</a
    > 
    — a morphing search bar with animated tabs for React.
  </p>
</footer>
