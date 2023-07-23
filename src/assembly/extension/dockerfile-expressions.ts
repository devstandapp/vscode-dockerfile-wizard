export function RUN(inputs: Array<string | boolean | Array<string | boolean>>): string {
	let stringLines = inputs
		.map(input => {
			if (Array.isArray(input)) {
				let out = ''
				let inp = input.filter(x => x)
				for (let i = 0; i < inp.length; i++) {
					out += '\t'.repeat(i == 0 ? 0 : 2)
					out += inp[i]
					if (i != inp.length - 1) {
						out += ' \\\n'
					}
				}
				return out
			} else {
				return input
			}
		})
		.filter(x => x)

	if (stringLines.length == 0) {
		return ''
	}
	if (stringLines.length == 1) {
		return `RUN ${stringLines[0]}`
	} else {
		return `RUN <<ENDRUN\n\t${stringLines.join('\n\t')}\nENDRUN`
	}
}
