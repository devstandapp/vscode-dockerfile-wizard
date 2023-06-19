<script>
	const regex = /(?<attr>[a-z]{1,})\s*=\s*"(?<value>[^"]{1,})"/gi

	export let svg = ''

	$: innerText = svg.replace(/<svg[ \n]([^>]*)>/, '').replace("</svg>", '')
	$: attrs = Object.fromEntries([...(svg.replace(/<svg([^>]+)>(.*)/gm, '$1').matchAll(regex))].flatMap(m => {
		return (Array.isArray(m) && m.length == 3 && typeof m[1] == 'string' && m[1].length > 0 && typeof m[2] == 'string' && m[2].length > 0 && m[1] !== 'xmlns') ? [[m[1], m[2]]] : []
	}))

</script>

<svg xmlns="http://www.w3.org/2000/svg"
	{...attrs}
	on:click
	{...$$restProps}
>{@html innerText}</svg>
