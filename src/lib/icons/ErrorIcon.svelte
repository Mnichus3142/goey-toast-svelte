<script lang="ts">
	interface Props {
		size?: number
		class?: string
	}
	let { size = 20, class: className }: Props = $props()
</script>

<svg
	xmlns="http://www.w3.org/2000/svg"
	width={size}
	height={size}
	viewBox="0 0 24 24"
	fill="none"
	stroke="currentColor"
	stroke-width="2"
	stroke-linecap="round"
	stroke-linejoin="round"
	class={className}
>
	<circle cx="12" cy="12" r="10" />
	<path d="M15 9l-6 6" />
	<path d="M9 9l6 6" />
</svg>
