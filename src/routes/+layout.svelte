<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
	<link
		href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Fjalla+One&display=swap"
		rel="stylesheet"
	/>
</svelte:head>

{@render children()}

<style>
	:global(*) {
		font-family: 'Fjalla One', sans-serif;
	}

	:global(body) {
		font-family: 'Fjalla One', sans-serif;
		-webkit-font-smoothing: antialiased;
		-moz-osx-font-smoothing: grayscale;
	}

	:global(h1, h2, h3, h4, h5, h6) {
		font-family: 'Bebas Neue', sans-serif;
		letter-spacing: 1px;
	}
</style>
