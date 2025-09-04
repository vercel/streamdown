export type ChunkMode = 'word' | 'line';

/**
 * Splits text into chunks by complete words. Trailing spaces after each word are kept with the word when present.
 */
export function chunkByWords(text: string): string[] {
	const result: string[] = [];
	const re = /(\S+)(\s*)/g;
	let match: RegExpExecArray | null;
	while ((match = re.exec(text)) !== null) {
		const word = match[1] ?? '';
		const spaces = match[2] ?? '';
		result.push(spaces.length > 0 ? word + spaces : word);
	}
	return result;
}

/**
 * Splits text into chunks by lines. Newline characters are kept with their preceding line when present.
 */
export function chunkByLines(text: string): string[] {
	const result: string[] = [];
	const re = /([^\n]*\n+)/g;
	let lastIndex = 0;
	let match: RegExpExecArray | null;
	while ((match = re.exec(text)) !== null) {
		result.push(match[0]);
		lastIndex = re.lastIndex;
	}
	if (lastIndex < text.length) {
		result.push(text.slice(lastIndex));
	}
	return result;
}

/**
 * Splits text by the provided mode (word | line).
 */
export function chunkText(text: string, mode: ChunkMode = 'word'): string[] {
	return mode === 'line' ? chunkByLines(text) : chunkByWords(text);
}
