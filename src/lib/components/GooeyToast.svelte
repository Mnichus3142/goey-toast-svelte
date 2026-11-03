<script lang="ts">
	import { animate } from 'motion'
	import { toast as sonnerToast } from 'svelte-sonner'
	import { fade, scale } from 'svelte/transition'
	import type { Component, Snippet } from 'svelte'
	import type { GooeyToastPhase, GooeyToastProps } from '../types.js'
	import { animationPresets } from '../presets.js'
	import {
		getGooeyPosition,
		getGooeyDir,
		getGooeySpring,
		getGooeyBounce,
		getGooeySwipeToDismiss,
		getGooeyTheme,
		getGooeyShowProgress,
		getGooeyCloseButton,
		subscribeContainerHovered,
		getContainerHovered,
		getGooeyShowTimestamp,
	} from '../context.js'
	import {
		DefaultIcon,
		SuccessIcon,
		ErrorIcon,
		WarningIcon,
		InfoIcon,
		SpinnerIcon,
	} from '../icons/index.js'
	import { prefersReducedMotion } from '../prefersReducedMotion.svelte.js'
	import {
		PH,
		DEFAULT_DISPLAY_DURATION,
		DEFAULT_EXPAND_DUR,
		DEFAULT_COLLAPSE_DUR,
		SMOOTH_EASE,
		squishSpring,
	} from '../animation.js'
	import { morphPath, morphPathCenter } from '../morph-path.js'
	import { syncSonnerHeights, registerSonnerObserver } from '../sonner-heights.js'
	import { styles } from './gooey-styles.js'

	let {
		title,
		description,
		type: _type,
		action,
		icon,
		phase,
		classNames,
		fillColor: fillColorProp,
		borderColor,
		borderWidth,
		timing,
		preset,
		spring: springProp,
		bounce: bounceProp,
		showTimestamp: showTimestampProp,
		showProgress: showProgressProp,
		toastId,
	}: GooeyToastProps = $props()

	const phaseIconMap: Record<
		Exclude<GooeyToastPhase, 'loading'>,
		Component<{ size?: number; class?: string }>
	> = {
		default: DefaultIcon,
		success: SuccessIcon,
		error: ErrorIcon,
		warning: WarningIcon,
		info: InfoIcon,
	}

	const titleColorMap: Record<GooeyToastPhase, string> = {
		loading: styles.titleLoading,
		default: styles.titleDefault,
		success: styles.titleSuccess,
		error: styles.titleError,
		warning: styles.titleWarning,
		info: styles.titleInfo,
	}

	const actionColorMap: Record<GooeyToastPhase, string> = {
		loading: styles.actionInfo,
		default: styles.actionDefault,
		success: styles.actionSuccess,
		error: styles.actionError,
		warning: styles.actionWarning,
		info: styles.actionInfo,
	}

	const progressColorMap: Record<GooeyToastPhase, string> = {
		loading: styles.progressInfo,
		default: styles.progressDefault,
		success: styles.progressSuccess,
		error: styles.progressError,
		warning: styles.progressWarning,
		info: styles.progressInfo,
	}

	const theme = getGooeyTheme()
	const closeButtonSetting = getGooeyCloseButton()
	const showCloseButton = closeButtonSetting !== false
	const fillColor = $derived(fillColorProp ?? (theme === 'dark' ? '#1a1a1a' : '#ffffff'))
	const position = getGooeyPosition()
	const dir = getGooeyDir()
	const posIsRight = position?.includes('right') ?? false
	const isCenter = position?.includes('center') ?? false
	const isRight = dir === 'rtl' ? (isCenter ? false : !posIsRight) : posIsRight

	const reducedMotion = prefersReducedMotion()

	const presetConfig = $derived(preset ? animationPresets[preset] : undefined)
	const useSpring = $derived(springProp ?? presetConfig?.spring ?? getGooeySpring())
	const bounceVal = $derived(bounceProp ?? presetConfig?.bounce ?? getGooeyBounce() ?? 0.4)
	const showProgress = $derived(showProgressProp ?? getGooeyShowProgress())
	const showTimestamp = $derived(showTimestampProp ?? getGooeyShowTimestamp())

	let actionSuccess = $state<string | null>(null)
	let dismissing = $state(false)
	let progressKey = $state(0)
	let hovered = $state(false)
	let hoveredRef = false
	let containerHoveredRef = getContainerHovered()
	let containerHovered = $state(getContainerHovered())
	let collapsingRef = false
	let preDismissRef = false
	let collapseEndTime = 0
	let expandedDimsRef = { pw: 0, bw: 0, th: 0 }

	const effectiveTitle = $derived(actionSuccess ?? title)
	const effectivePhase: GooeyToastPhase = $derived(actionSuccess ? 'success' : phase)
	const effectiveDescription = $derived(actionSuccess ? undefined : description)
	const effectiveAction = $derived(actionSuccess ? undefined : action)

	const isLoading = $derived(effectivePhase === 'loading')
	const hasDescription = $derived(Boolean(effectiveDescription))
	const hasAction = $derived(Boolean(effectiveAction))
	const isExpanded = $derived((hasDescription || hasAction) && !dismissing)

	let showBody = $state(false)

	let wrapperEl: HTMLDivElement | undefined = $state()
	let pathEl: SVGPathElement | undefined = $state()
	let headerEl: HTMLDivElement | undefined = $state()
	let contentEl: HTMLDivElement | undefined = $state()

	let morphCtrl: ReturnType<typeof animate> | null = null
	let pillResizeCtrl: ReturnType<typeof animate> | null = null
	let headerSquishCtrl: ReturnType<typeof animate> | null = null
	let blobSquishCtrl: ReturnType<typeof animate> | null = null
	let shakeCtrl: ReturnType<typeof animate> | null = null

	// Imperative animation state — NOT $state (avoids re-renders every frame)
	let morphT = 0
	let aDims = { pw: 0, bw: 0, th: 0 }
	let dimsRef = { pw: 0, bw: 0, th: 0 }

	let dims = $state({ pw: 0, bw: 0, th: 0 })
	const hasDims = $derived(dims.pw > 0 && dims.bw > 0 && dims.th > 0)

	const expandDur = DEFAULT_EXPAND_DUR
	const collapseDur = DEFAULT_COLLAPSE_DUR
	let lastSquishTime = 0
	let mountSquished = false
	let prevShowBody = false
	let prevPhase: GooeyToastPhase | null = null
	let remainingRef: number | null = null
	let timerStartRef = 0
	let reExpandingRef = false
	let headerSquished = false

	const SWIPE_THRESHOLD = 100
	let swipeStart: { x: number; y: number } | null = null
	let swipeOffsetX = $state(0)
	let isSwiping = false

	const createdAt = new Date()
	const timestampStr = createdAt.toLocaleTimeString(undefined, {
		hour: 'numeric',
		minute: '2-digit',
		second: '2-digit',
	})

	const iconKey = $derived(isLoading ? 'spinner' : effectivePhase)
	const iconFadeMs = $derived(reducedMotion.current ? 10 : 200)
	const bodyFadeMs = $derived(reducedMotion.current ? 10 : 350)

	const progressDelayMs = $derived.by(() => {
		const expandDelayMs = reducedMotion.current ? 0 : 330
		const collapseMs = reducedMotion.current ? 10 : 0.9 * 1000
		const displayMs = timing?.displayDuration ?? DEFAULT_DISPLAY_DURATION
		return Math.max(displayMs - expandDelayMs - collapseMs, 0)
	})

	const progressDelayCss = $derived(
		progressDelayMs || (timing?.displayDuration ?? DEFAULT_DISPLAY_DURATION),
	)

	const canExpand = $derived(hasDescription || hasAction)

	const swipeOpacity = $derived(
		swipeOffsetX !== 0
			? Math.max(0, 1 - Math.abs(swipeOffsetX) / (SWIPE_THRESHOLD * 1.5))
			: 1,
	)
	const swipeTranslate = $derived(
		swipeOffsetX !== 0 ? `translateX(${swipeOffsetX}px)` : '',
	)

	const wrapperStyle = $derived.by(() => {
		const parts: string[] = []
		let transform = ''
		if (isCenter) {
			parts.push('margin: 0 auto')
		} else if (isRight) {
			parts.push('margin-left: auto')
			transform = 'scaleX(-1)'
		}
		if (swipeTranslate) {
			transform = (transform ? transform + ' ' : '') + swipeTranslate
			parts.push(`opacity: ${swipeOpacity}`)
			parts.push('transition: none')
		}
		if (transform) parts.push(`transform: ${transform}`)
		return parts.length > 0 ? parts.join('; ') : undefined
	})

	const contentTextAlign = $derived(
		isCenter ? 'center' : isRight ? 'right' : 'left',
	)
	const contentTransform = $derived(isRight && !isCenter ? 'scaleX(-1)' : undefined)

	const closeButtonIsRight = $derived(
		isRight ? closeButtonSetting !== 'top-right' : closeButtonSetting === 'top-right',
	)

	function flush() {
		const { pw: p, bw: b, th: h } = aDims
		if (p <= 0 || b <= 0 || h <= 0) return
		const t = Math.max(0, Math.min(1, morphT))
		const pos = getGooeyPosition()
		const d = getGooeyDir()
		const centerPos = pos?.includes('center') ?? false
		const posRight = pos?.includes('right') ?? false
		const rightSide = d === 'rtl' ? (centerPos ? false : !posRight) : posRight

		if (centerPos) {
			const centerBw = Math.max(dimsRef.bw, expandedDimsRef.bw, p)
			pathEl?.setAttribute('d', morphPathCenter(p, centerBw, h, t))
		} else {
			pathEl?.setAttribute('d', morphPath(p, b, h, t))
		}

		if (t >= 1) {
			if (wrapperEl) {
				wrapperEl.style.width = ''
			}
			if (contentEl) {
				contentEl.style.width = ''
				contentEl.style.overflow = ''
				contentEl.style.maxHeight = ''
				contentEl.style.clipPath = ''
			}
		} else if (t > 0) {
			const targetBw = dimsRef.bw
			const targetTh = dimsRef.th
			const pillW = Math.min(p, b)
			const currentW = pillW + (b - pillW) * t
			const currentH = PH + (targetTh - PH) * t
			const centerFullW = centerPos
				? Math.max(dimsRef.bw, expandedDimsRef.bw, p)
				: 0
			if (wrapperEl) {
				wrapperEl.style.width = (centerPos ? centerFullW : currentW) + 'px'
			}
			if (contentEl) {
				contentEl.style.width = (centerPos ? centerFullW : targetBw) + 'px'
				contentEl.style.overflow = 'hidden'
				contentEl.style.maxHeight = currentH + 'px'
				if (centerPos) {
					const clip = (centerFullW - currentW) / 2
					contentEl.style.clipPath = `inset(0 ${clip}px 0 ${clip}px)`
				} else {
					const clip = targetBw - currentW
					contentEl.style.clipPath = rightSide
						? `inset(0 0 0 ${clip}px)`
						: `inset(0 ${clip}px 0 0)`
				}
			}
		} else {
			const pillW = Math.min(p, b)
			if (wrapperEl) {
				const centerBw = centerPos
					? Math.max(dimsRef.bw, expandedDimsRef.bw, p)
					: pillW
				wrapperEl.style.width = centerBw + 'px'
			}
			if (contentEl) {
				if (centerPos) {
					const centerBwVal = Math.max(dimsRef.bw, expandedDimsRef.bw, p)
					contentEl.style.width = centerBwVal + 'px'
					const clip = (centerBwVal - pillW) / 2
					contentEl.style.clipPath = `inset(0 ${clip}px 0 ${clip}px)`
				} else {
					contentEl.style.width = ''
					contentEl.style.clipPath = ''
				}
				contentEl.style.overflow = 'hidden'
				contentEl.style.maxHeight = PH + 'px'
			}
		}
	}

	function measure() {
		if (!headerEl || !contentEl) return
		const wr = wrapperEl
		const savedW = wr?.style.width ?? ''
		const savedOv = contentEl.style.overflow
		const savedMH = contentEl.style.maxHeight
		const savedCW = contentEl.style.width
		if (wr) {
			wr.style.width = ''
		}
		contentEl.style.overflow = ''
		contentEl.style.maxHeight = ''
		contentEl.style.width = ''

		const cs = getComputedStyle(contentEl)
		const paddingX = parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight)
		const pw = headerEl.offsetWidth + paddingX
		const bw = contentEl.offsetWidth
		const th = contentEl.offsetHeight

		if (wr) {
			wr.style.width = savedW
		}
		contentEl.style.overflow = savedOv
		contentEl.style.maxHeight = savedMH
		contentEl.style.width = savedCW

		dimsRef = { pw, bw, th }
		dims = { pw, bw, th }
	}

	function triggerLandingSquish(squishPhase: 'expand' | 'collapse' | 'mount' = 'mount') {
		if (!wrapperEl || reducedMotion.current) return
		if (!useSpring) return
		const now = Date.now()
		if (now - lastSquishTime < 300) return
		lastSquishTime = now
		blobSquishCtrl?.stop()
		const el = wrapperEl
		const springConfig =
			squishPhase === 'collapse'
				? squishSpring(collapseDur, DEFAULT_COLLAPSE_DUR, bounceVal)
				: squishSpring(expandDur, DEFAULT_EXPAND_DUR, bounceVal)
		const bScale = bounceVal / 0.4
		const compressY = (squishPhase === 'collapse' ? 0.035 : 0.12) * bScale
		const expandX = (squishPhase === 'collapse' ? 0.018 : 0.06) * bScale
		blobSquishCtrl = animate(0, 1, {
			...springConfig,
			onUpdate: (v) => {
				const intensity = Math.sin(v * Math.PI)
				const sy = 1 - compressY * intensity
				const sx = 1 + expandX * intensity
				const mirror = el.style.transform?.includes('scaleX(-1)') ? 'scaleX(-1) ' : ''
				el.style.transformOrigin = 'center top'
				el.style.transform = mirror + `scaleX(${sx}) scaleY(${sy})`
			},
			onComplete: () => {
				const right = el.style.transform?.includes('scaleX(-1)')
				el.style.transform = right ? 'scaleX(-1)' : ''
				el.style.transformOrigin = ''
			},
		})
	}

	function handleActionClick() {
		if (!effectiveAction) return
		if (effectiveAction.successLabel) {
			expandedDimsRef = { ...aDims }
			collapsingRef = true
			actionSuccess = effectiveAction.successLabel
		}
		try {
			effectiveAction.onClick()
		} catch {
			/* onClick errors shouldn't block morph-back */
		}
	}

	function handleMouseEnter() {
		hoveredRef = true
		hovered = true
	}

	function handleMouseLeave() {
		hoveredRef = false
		hovered = false
	}

	function handleTouchStart(e: TouchEvent) {
		if (!getGooeySwipeToDismiss()) return
		const touch = e.touches[0]
		swipeStart = { x: touch.clientX, y: touch.clientY }
		isSwiping = false
	}

	function handleTouchMove(e: TouchEvent) {
		if (!swipeStart || !getGooeySwipeToDismiss()) return
		const touch = e.touches[0]
		const dx = touch.clientX - swipeStart.x
		const dy = touch.clientY - swipeStart.y

		if (!isSwiping && Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 10) {
			swipeStart = null
			return
		}

		if (!isSwiping && Math.abs(dx) > 10) {
			isSwiping = true
		}

		if (isSwiping) {
			swipeOffsetX = dx
		}
	}

	function handleTouchEnd() {
		if (!getGooeySwipeToDismiss()) {
			swipeStart = null
			return
		}
		if (isSwiping && Math.abs(swipeOffsetX) >= SWIPE_THRESHOLD && toastId) {
			sonnerToast.dismiss(toastId)
		}
		swipeStart = null
		isSwiping = false
		swipeOffsetX = 0
	}

	function handleCloseClick(e: MouseEvent) {
		e.stopPropagation()
		if (toastId != null) sonnerToast.dismiss(toastId)
	}

	$effect(() => {
		return subscribeContainerHovered((h) => {
			containerHoveredRef = h
			containerHovered = h
		})
	})

	// Measure on prop changes (like useLayoutEffect)
	$effect.pre(() => {
		void effectiveTitle
		void effectivePhase
		void isExpanded
		void showBody
		void effectiveDescription
		void effectiveAction
		measure()
		const t = setTimeout(measure, 100)
		return () => clearTimeout(t)
	})

	$effect(() => {
		if (!contentEl) return
		const ro = new ResizeObserver(measure)
		ro.observe(contentEl)
		return () => ro.disconnect()
	})

	// Handle dims changes: pill resize (compact) or direct update (expanded)
	$effect.pre(() => {
		const { pw, bw, th } = dims
		const ready = pw > 0 && bw > 0 && th > 0
		if (!ready || collapsingRef) return

		const prev = { ...aDims }
		const target = { pw, bw, th }

		if (prev.bw <= 0) {
			aDims = target
			flush()
			return
		}

		if (morphT > 0 && morphT < 1) {
			aDims = target
			flush()
			return
		}

		if (showBody) {
			aDims = target
			flush()
			return
		}

		if (prev.bw === target.bw && prev.pw === target.pw && prev.th === target.th) return

		if (reducedMotion.current) {
			aDims = target
			flush()
			return
		}

		pillResizeCtrl?.stop()
		if (Date.now() - collapseEndTime > 500 && !isExpanded) {
			triggerLandingSquish('expand')
		}
		const pillResizeTransition = useSpring
			? { type: 'spring' as const, duration: 0.5, bounce: bounceVal * 0.875 }
			: { duration: 0.4, ease: SMOOTH_EASE }
		pillResizeCtrl = animate(0, 1, {
			...pillResizeTransition,
			onUpdate: (t) => {
				aDims = {
					pw: prev.pw + (target.pw - prev.pw) * t,
					bw: prev.bw + (target.bw - prev.bw) * t,
					th: prev.th + (target.th - prev.th) * t,
				}
				flush()
			},
		})
	})

	// Squish on entry: only for simple toasts (no body)
	$effect(() => {
		if (hasDims && !mountSquished && !isExpanded) {
			mountSquished = true
			const t = setTimeout(() => triggerLandingSquish(), 45)
			return () => clearTimeout(t)
		}
	})

	// Squish on expand (showBody false→true)
	$effect.pre(() => {
		if (!prevShowBody && showBody && !hoveredRef) {
			const t = setTimeout(() => triggerLandingSquish('expand'), 80)
			prevShowBody = showBody
			return () => clearTimeout(t)
		}
		prevShowBody = showBody
	})

	// Error shake
	$effect(() => {
		const currentPhase = phase
		if (prevPhase === null) {
			prevPhase = currentPhase
			return () => {
				shakeCtrl?.stop()
			}
		}
		if (
			currentPhase === 'error' &&
			prevPhase !== 'error' &&
			!dismissing &&
			wrapperEl &&
			!reducedMotion.current
		) {
			shakeCtrl?.stop()
			const el = wrapperEl
			const mirror = el.style.transform?.includes('scaleX(-1)') ? 'scaleX(-1) ' : ''
			shakeCtrl = animate(0, 1, {
				duration: 0.4,
				ease: 'easeOut',
				onUpdate: (v) => {
					const decay = 1 - v
					const shake = Math.sin(v * Math.PI * 6) * decay * 3
					el.style.transform = mirror + `translateX(${shake}px)`
				},
				onComplete: () => {
					el.style.transform = mirror.trim() || ''
				},
			})
		}
		prevPhase = currentPhase
		return () => {
			shakeCtrl?.stop()
		}
	})

	// Phase 1: expand (delay showBody) or collapse (reverse morph)
	$effect(() => {
		if (isExpanded) {
			const delay = reducedMotion.current ? 0 : 330
			const t1 = setTimeout(() => {
				showBody = true
			}, delay)
			return () => clearTimeout(t1)
		}

		morphCtrl?.stop()
		pillResizeCtrl?.stop()

		if (morphT > 0) {
			const csPad = contentEl ? getComputedStyle(contentEl) : null
			const padX = csPad
				? parseFloat(csPad.paddingLeft) + parseFloat(csPad.paddingRight)
				: 20
			const targetPw = headerEl ? headerEl.offsetWidth + padX : aDims.pw
			const targetDims = { pw: targetPw, bw: targetPw, th: PH }

			if (reducedMotion.current) {
				morphT = 0
				collapsingRef = false
				preDismissRef = false
				showBody = false
				aDims = { ...targetDims }
				flush()
				return
			}

			const savedDims =
				expandedDimsRef.bw > 0 ? { ...expandedDimsRef } : { ...aDims }

			const isPreDismiss = preDismissRef
			const collapseDuration = 0.9
			const collapseTransition =
				isPreDismiss || !useSpring
					? { duration: collapseDuration, ease: SMOOTH_EASE }
					: {
							type: 'spring' as const,
							duration: collapseDuration,
							bounce: bounceVal * 0.875,
						}

			triggerLandingSquish('collapse')

			morphCtrl = animate(morphT, 0, {
				...collapseTransition,
				onUpdate: (t) => {
					morphT = t
					aDims = {
						pw: targetDims.pw + (savedDims.pw - targetDims.pw) * t,
						bw: targetDims.bw + (savedDims.bw - targetDims.bw) * t,
						th: targetDims.th + (savedDims.th - targetDims.th) * t,
					}
					flush()
					syncSonnerHeights(wrapperEl ?? null, true)
				},
				onComplete: () => {
					morphT = 0
					collapsingRef = false
					preDismissRef = false
					collapseEndTime = Date.now()
					aDims = { ...targetDims }
					flush()
					syncSonnerHeights(wrapperEl ?? null, true)
					showBody = false
				},
			})
			return () => {
				morphCtrl?.stop()
			}
		}

		showBody = false
		morphT = 0
		flush()
	})

	// Pre-dismiss collapse timer
	$effect(() => {
		if (!showBody || actionSuccess || dismissing) return

		const fullDelay = progressDelayMs
		if (fullDelay <= 0) return

		if (hoveredRef || containerHoveredRef) return
		// track hover state for re-run
		void hovered
		void containerHovered

		const delay = remainingRef ?? fullDelay
		timerStartRef = Date.now()

		const timer = setTimeout(() => {
			if (hoveredRef || containerHoveredRef) {
				const elapsed = Date.now() - timerStartRef
				remainingRef = Math.max(0, delay - elapsed)
				return
			}
			remainingRef = null
			expandedDimsRef = { ...aDims }
			collapsingRef = true
			preDismissRef = true
			dismissing = true
		}, delay)

		return () => {
			clearTimeout(timer)
			const elapsed = Date.now() - timerStartRef
			const remaining = delay - elapsed
			if (remaining > 0 && (hoveredRef || containerHoveredRef)) {
				remainingRef = remaining
			}
		}
	})

	// Re-expand on hover
	$effect(() => {
		if ((!hovered && !containerHovered) || !canExpand || !dismissing) return
		morphCtrl?.stop()
		collapsingRef = false
		preDismissRef = false
		remainingRef = null
		reExpandingRef = true
		dismissing = false
		showBody = true
		if (showProgress) progressKey = progressKey + 1

		const currentT = morphT
		const startDims = { ...aDims }
		const morphExpandTransition = useSpring
			? { type: 'spring' as const, duration: 0.9, bounce: bounceVal }
			: { duration: 0.6, ease: SMOOTH_EASE }

		const raf = requestAnimationFrame(() => {
			morphCtrl = animate(currentT, 1, {
				...morphExpandTransition,
				onUpdate: (t) => {
					morphT = t
					const target = dimsRef
					aDims = {
						pw: startDims.pw + (target.pw - startDims.pw) * t,
						bw: startDims.bw + (target.bw - startDims.bw) * t,
						th: startDims.th + (target.th - startDims.th) * t,
					}
					flush()
					syncSonnerHeights(wrapperEl ?? null, true)
				},
				onComplete: () => {
					morphT = 1
					aDims = { ...dimsRef }
					reExpandingRef = false
					flush()
					syncSonnerHeights(wrapperEl ?? null, true)
				},
			})
		})

		return () => {
			cancelAnimationFrame(raf)
			morphCtrl?.stop()
		}
	})

	// Dismiss from Sonner after collapse completes
	$effect(() => {
		if (!toastId || !dismissing || showBody) return
		const t = setTimeout(() => {
			if (!hoveredRef && !containerHoveredRef) {
				sonnerToast.dismiss(toastId)
			}
		}, 800)
		return () => clearTimeout(t)
	})

	// Dismiss after action success morph-back
	$effect(() => {
		if (!toastId || !actionSuccess || showBody) return
		const t = setTimeout(() => sonnerToast.dismiss(toastId), 1200)
		return () => clearTimeout(t)
	})

	// Phase 2: morph from pill → blob
	$effect(() => {
		if (reExpandingRef) return
		if (!showBody) {
			morphT = 0
			morphCtrl?.stop()
			flush()
			return
		}

		if (reducedMotion.current) {
			pillResizeCtrl?.stop()
			morphCtrl?.stop()
			morphT = 1
			aDims = { ...dimsRef }
			flush()
			syncSonnerHeights(wrapperEl ?? null, true)
			return
		}

		const spring = useSpring
		const bounce = bounceVal

		const raf = requestAnimationFrame(() => {
			pillResizeCtrl?.stop()
			morphCtrl?.stop()
			const startDims = { ...aDims }
			const morphExpandTransition = spring
				? { type: 'spring' as const, duration: 0.9, bounce }
				: { duration: 0.6, ease: SMOOTH_EASE }
			morphCtrl = animate(0, 1, {
				...morphExpandTransition,
				onUpdate: (t) => {
					morphT = t
					const target = dimsRef
					aDims = {
						pw: startDims.pw + (target.pw - startDims.pw) * t,
						bw: startDims.bw + (target.bw - startDims.bw) * t,
						th: startDims.th + (target.th - startDims.th) * t,
					}
					flush()
					syncSonnerHeights(wrapperEl ?? null, true)
				},
				onComplete: () => {
					morphT = 1
					aDims = { ...dimsRef }
					flush()
					syncSonnerHeights(wrapperEl ?? null, true)
				},
			})
		})

		return () => {
			cancelAnimationFrame(raf)
			morphCtrl?.stop()
		}
	})

	// Header elastic squish
	$effect(() => {
		if (!headerEl || reducedMotion.current) return
		headerSquishCtrl?.stop()
		const el = headerEl

		if (showBody && !dismissing && !actionSuccess) {
			if (!useSpring) return
			headerSquished = true
			headerSquishCtrl = animate(0, 1, {
				...squishSpring(expandDur, DEFAULT_EXPAND_DUR, bounceVal),
				onUpdate: (v) => {
					const s = 1 - 0.05 * v
					const pushY = v * 1
					el.style.transform = `scale(${s}) translateY(${pushY}px)`
				},
			})
		} else if (headerSquished) {
			headerSquished = false
			const isSpringCollapse = !preDismissRef && useSpring
			const transition = isSpringCollapse
				? squishSpring(collapseDur, DEFAULT_COLLAPSE_DUR, bounceVal)
				: { duration: collapseDur * 0.5, ease: SMOOTH_EASE }
			headerSquishCtrl = animate(1, 0, {
				...transition,
				onUpdate: (v) => {
					const s = 1 - 0.05 * v
					const pushY = v * 1
					el.style.transform = `scale(${s}) translateY(${pushY}px)`
				},
				onComplete: () => {
					el.style.transform = ''
				},
			})
		}

		return () => {
			headerSquishCtrl?.stop()
		}
	})

	// Sonner height sync observer
	$effect(() => {
		const wrapper = wrapperEl
		if (!wrapper) return
		const ol = wrapper.closest('[data-sonner-toast]')?.parentElement
		if (!ol) return

		const unregister = registerSonnerObserver(ol, () => {
			syncSonnerHeights(wrapper, true)
		})

		const expandObs = new MutationObserver((mutations) => {
			for (const m of mutations) {
				if (
					m.type === 'attributes' &&
					m.attributeName === 'data-expanded' &&
					(m.target as HTMLElement).getAttribute('data-expanded') === 'true'
				) {
					syncSonnerHeights(wrapper, true)
					break
				}
			}
		})
		expandObs.observe(ol, {
			attributes: true,
			attributeFilter: ['data-expanded'],
			subtree: true,
		})

		return () => {
			unregister()
			expandObs.disconnect()
		}
	})
</script>

<div
	bind:this={wrapperEl}
	class="{styles.wrapper}{classNames?.wrapper ? ` ${classNames.wrapper}` : ''}"
	style={wrapperStyle}
	role={effectivePhase === 'error' || effectivePhase === 'warning' ? 'alert' : 'status'}
	aria-live={effectivePhase === 'error' || effectivePhase === 'warning' ? 'assertive' : 'polite'}
	aria-atomic="true"
	onmouseenter={handleMouseEnter}
	onmouseleave={handleMouseLeave}
	ontouchstart={handleTouchStart}
	ontouchmove={handleTouchMove}
	ontouchend={handleTouchEnd}
	data-center={isCenter || undefined}
	data-theme={theme}
>
	<svg class={styles.blobSvg} aria-hidden="true">
		<path
			bind:this={pathEl}
			fill={fillColor}
			stroke={borderColor || 'none'}
			stroke-width={borderColor ? (borderWidth ?? 1.5) : 0}
		/>
	</svg>

	{#if showCloseButton && effectivePhase !== 'loading'}
		<button
			class="{styles.closeButton}{closeButtonIsRight ? ` ${styles.closeButtonRight}` : ''}"
			aria-label="Close toast"
			type="button"
			style:background={fillColor}
			style:border-color={borderColor || 'transparent'}
			style:border-width={borderColor ? `${borderWidth ?? 1.5}px` : '0'}
			style:box-shadow={borderColor ? 'none' : '0 1px 4px rgba(0, 0, 0, 0.2)'}
			style:top={isCenter && closeButtonSetting !== 'top-right' ? '6px' : undefined}
			style:left={isCenter && closeButtonSetting !== 'top-right' ? '-1px' : undefined}
			onclick={handleCloseClick}
		>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width="12"
				height="12"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
			>
				<line x1="18" y1="6" x2="6" y2="18" />
				<line x1="6" y1="6" x2="18" y2="18" />
			</svg>
		</button>
	{/if}

	<div
		bind:this={contentEl}
		class="{styles.content} {showBody
			? styles.contentExpanded
			: styles.contentCompact}{classNames?.content ? ` ${classNames.content}` : ''}"
		style:text-align={contentTextAlign}
		style:transform={contentTransform}
	>
		<div
			bind:this={headerEl}
			class="{styles.header} {titleColorMap[effectivePhase]}{classNames?.header
				? ` ${classNames.header}`
				: ''}"
		>
			<div
				class="{styles.iconWrapper}{classNames?.icon ? ` ${classNames.icon}` : ''}"
			>
				{#key iconKey}
					<div
						in:scale={{ duration: iconFadeMs, start: 0.5, opacity: 0 }}
						out:scale={{ duration: iconFadeMs, start: 0.5, opacity: 0 }}
					>
						{#if !actionSuccess && icon}
							{#if typeof icon === 'string'}
								{icon}
							{:else}
								{@const Icon = icon as Component<{ size?: number }>}
								<Icon size={18} />
							{/if}
						{:else if isLoading}
							<SpinnerIcon size={18} class={styles.spinnerSpin} />
						{:else}
							{@const PhaseIcon =
								phaseIconMap[effectivePhase as Exclude<GooeyToastPhase, 'loading'>]}
							<PhaseIcon size={18} />
						{/if}
					</div>
				{/key}
			</div>
			<span
				class="{styles.title}{classNames?.title ? ` ${classNames.title}` : ''}"
				>{effectiveTitle}</span
			>
			{#if !hasDescription && !hasAction && !actionSuccess && showTimestamp}
				<span class={styles.timestamp}>{timestampStr}</span>
			{/if}
		</div>

		{#if showBody && hasDescription && !dismissing && effectiveDescription}
			<div
				class="{styles.description}{classNames?.description
					? ` ${classNames.description}`
					: ''}"
				style:text-align="left"
				transition:fade={{ duration: bodyFadeMs }}
			>
				<div style:display="flex" style:align-items="flex-start" style:gap="10px">
					<div style:flex="1" style:min-width="0">
						{#if typeof effectiveDescription === 'string'}
							{effectiveDescription}
						{:else}
							{@render (effectiveDescription as Snippet)()}
						{/if}
					</div>
					{#if showTimestamp}
						<span class={styles.timestamp}>{timestampStr}</span>
					{/if}
				</div>
			</div>
		{/if}

		{#if showBody && !hasDescription && hasAction && !dismissing && showTimestamp}
			<div
				class={styles.timestamp}
				style:text-align="right"
				style:margin-top="8px"
				style:padding-left="0"
				transition:fade={{ duration: bodyFadeMs }}
			>
				{timestampStr}
			</div>
		{/if}

		{#if showBody && hasAction && effectiveAction && !dismissing}
			<div
				class="{styles.actionWrapper}{classNames?.actionWrapper
					? ` ${classNames.actionWrapper}`
					: ''}"
				in:fade={{
					duration: bodyFadeMs,
					delay: reducedMotion.current ? 0 : 100,
				}}
				out:fade={{ duration: bodyFadeMs }}
			>
				<button
					class="{styles.actionButton} {actionColorMap[effectivePhase]}{classNames?.actionButton
						? ` ${classNames.actionButton}`
						: ''}"
					onclick={handleActionClick}
					type="button"
					aria-label={effectiveAction.label}
				>
					{effectiveAction.label}
				</button>
			</div>
		{/if}

		{#if showProgress}
			{#key progressKey}
				<div
					class="{styles.progressWrapper}{hovered || containerHovered
						? ` ${styles.progressPaused}`
						: ''}"
					style:opacity={showBody && !actionSuccess ? 1 : 0}
				>
					<div
						class="{styles.progressBar} {progressColorMap[effectivePhase]}"
						style="--gooey-progress-duration: {progressDelayCss}ms"
					></div>
				</div>
			{/key}
		{/if}
	</div>
</div>
