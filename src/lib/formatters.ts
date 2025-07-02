/**
 * Format large numbers into readable formats (10M, 100B, etc.)
 */
export function formatLargeNumber(
	value: string | number | null | undefined
): string {
	// Handle null/undefined values
	if (value === null || value === undefined) {
		return 'N/A';
	}

	// Handle string inputs that might have $ or commas
	const numStr = typeof value === 'string' ? value : value.toString();

	// Remove $ and commas to get clean number
	const cleanStr = numStr.replace(/[$,]/g, '');
	const num = parseFloat(cleanStr);

	// If it's not a valid number, return original string
	if (isNaN(num)) {
		return numStr;
	}

	// Handle special cases
	if (num === 0) return '0';
	if (num < 1000) return num.toFixed(0);

	const units = [
		{ value: 1e12, symbol: 'T' }, // Trillion
		{ value: 1e9, symbol: 'B' }, // Billion
		{ value: 1e6, symbol: 'M' }, // Million
		{ value: 1e3, symbol: 'K' }, // Thousand
	];

	for (const unit of units) {
		if (num >= unit.value) {
			const formatted = (num / unit.value).toFixed(1);
			// Remove .0 if it's a whole number
			const clean = formatted.endsWith('.0')
				? formatted.slice(0, -2)
				: formatted;
			return `${clean}${unit.symbol}`;
		}
	}

	return num.toFixed(0);
}

/**
 * Format currency values with appropriate scaling
 */
export function formatCurrency(
	value: string | number | null | undefined
): string {
	// Handle null/undefined values
	if (value === null || value === undefined) {
		return 'N/A';
	}

	const numStr = typeof value === 'string' ? value : value.toString();

	// If it already has $ and looks formatted, just scale it
	if (numStr.includes('$')) {
		const formatted = formatLargeNumber(numStr);
		return formatted.startsWith('$') ? formatted : `$${formatted}`;
	}

	// Otherwise add $ and format
	const formatted = formatLargeNumber(numStr);
	return `$${formatted}`;
}

/**
 * Format percentage values
 */
export function formatPercentage(
	value: string | number | null | undefined
): string {
	// Handle null/undefined values
	if (value === null || value === undefined) {
		return 'N/A';
	}

	const numStr = typeof value === 'string' ? value : value.toString();

	// Remove % if it exists
	const cleanStr = numStr.replace('%', '');
	const num = parseFloat(cleanStr);

	if (isNaN(num)) return numStr;

	// Format with 1 decimal place and add %
	return `${num.toFixed(1)}%`;
}

/**
 * Format whole numbers with commas (for smaller counts)
 */
export function formatCount(value: string | number | null | undefined): string {
	// Handle null/undefined values
	if (value === null || value === undefined) {
		return 'N/A';
	}

	const numStr = typeof value === 'string' ? value : value.toString();

	// Remove commas to get clean number
	const cleanStr = numStr.replace(/,/g, '');
	const num = parseFloat(cleanStr);

	if (isNaN(num)) return numStr;

	// For counts under 100K, show with commas
	if (num < 100000) {
		return num.toLocaleString();
	}

	// For larger counts, use abbreviated format
	return formatLargeNumber(num);
}

/**
 * Smart formatter that automatically chooses the best format
 */
export function smartFormat(
	value: string | number | null | undefined,
	type?: 'currency' | 'percentage' | 'count'
): string {
	// Handle null/undefined values
	if (value === null || value === undefined) {
		return 'N/A';
	}

	if (type === 'currency') return formatCurrency(value);
	if (type === 'percentage') return formatPercentage(value);
	if (type === 'count') return formatCount(value);

	// Auto-detect based on value
	const str = typeof value === 'string' ? value : value.toString();

	if (str.includes('$')) return formatCurrency(value);
	if (str.includes('%')) return formatPercentage(value);

	return formatLargeNumber(value);
}
