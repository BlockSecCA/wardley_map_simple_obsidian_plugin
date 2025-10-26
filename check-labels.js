const fs = require('fs');

const svg = fs.readFileSync('Tea-Shop.svg', 'utf-8');

// Extract component labels and their positions
const labelRegex = /<text x="([^"]+)" y="([^"]+)" text-anchor="middle" font-size="(\d+)" font-weight="bold"[^>]*>([^<]+)<\/text>/g;

const labels = [];
let match;

while ((match = labelRegex.exec(svg)) !== null) {
	const text = match[4];
	// Skip axis labels and title
	if (!['Evolution →', 'Value Chain ↑', 'Tea Shop'].includes(text)) {
		labels.push({
			text: text,
			x: parseFloat(match[1]),
			y: parseFloat(match[2]),
			fontSize: parseInt(match[3]),
		});
	}
}

console.log('\n📝 LABEL POSITIONS\n');
console.log('Label'.padEnd(20) + 'X'.padEnd(10) + 'Y'.padEnd(10) + 'Est. Width (px)');
console.log('─'.repeat(60));

// Rough estimate: 1 character ≈ 7px at font-size 12
labels.forEach(label => {
	const estimatedWidth = label.text.length * 7;
	console.log(
		label.text.padEnd(20) +
		label.x.toFixed(1).padEnd(10) +
		label.y.toFixed(1).padEnd(10) +
		estimatedWidth
	);
});

console.log('\n🔍 OVERLAP DETECTION (Labels)\n');

// Group labels by Y position (same horizontal line)
const yGroups = new Map();
labels.forEach(label => {
	const yKey = label.y.toFixed(0);
	if (!yGroups.has(yKey)) {
		yGroups.set(yKey, []);
	}
	yGroups.get(yKey).push(label);
});

let hasOverlaps = false;

for (const [y, group] of yGroups) {
	if (group.length > 1) {
		// Sort by X position
		group.sort((a, b) => a.x - b.x);

		console.log(`Labels at Y=${y}:`);
		for (let i = 0; i < group.length; i++) {
			const label = group[i];
			const estWidth = label.text.length * 7;
			const leftEdge = label.x - estWidth / 2;
			const rightEdge = label.x + estWidth / 2;

			console.log(`  ${label.text.padEnd(20)} X: ${label.x.toFixed(1).padStart(6)} (${leftEdge.toFixed(1)} to ${rightEdge.toFixed(1)})`);

			// Check overlap with next label
			if (i < group.length - 1) {
				const nextLabel = group[i + 1];
				const nextEstWidth = nextLabel.text.length * 7;
				const nextLeftEdge = nextLabel.x - nextEstWidth / 2;

				const gap = nextLeftEdge - rightEdge;
				if (gap < 0) {
					console.log(`    ⚠️  OVERLAP with ${nextLabel.text}: ${Math.abs(gap).toFixed(1)}px`);
					hasOverlaps = true;
				} else {
					console.log(`    ✓ Gap to ${nextLabel.text}: ${gap.toFixed(1)}px`);
				}
			}
		}
		console.log('');
	}
}

if (!hasOverlaps) {
	console.log('✅ No label overlaps detected!\n');
} else {
	console.log('⚠️  Some labels may be overlapping!\n');
}
