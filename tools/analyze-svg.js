const fs = require('fs');

const svg = fs.readFileSync('Tea-Shop.svg', 'utf-8');

// Extract circles with their positions and colors
const circleRegex = /<circle cx="([^"]+)" cy="([^"]+)" r="[^"]+" fill="([^"]+)"/g;
const textRegex = /<text[^>]*>([^<]+)<\/text>/g;

const circles = [];
let match;

while ((match = circleRegex.exec(svg)) !== null) {
	circles.push({
		cx: parseFloat(match[1]),
		cy: parseFloat(match[2]),
		fill: match[3],
	});
}

const texts = [];
while ((match = textRegex.exec(svg)) !== null) {
	const text = match[1];
	if (!['Genesis', 'Custom Built', 'Product', 'Commodity', 'Evolution →', 'Value Chain ↑', 'Tea Shop'].includes(text) && !text.startsWith('[')) {
		texts.push(text);
	}
}

const colorNames = {
	'#4ECDC4': 'custom (teal)',
	'#96CEB4': 'commodity (green)',
	'#45B7D1': 'product (blue)',
	'#FF6B6B': 'genesis (red)',
};

console.log('\n📊 COMPONENT ANALYSIS\n');
console.log('Component Name'.padEnd(20) + 'X Position'.padEnd(15) + 'Y Position'.padEnd(15) + 'Color (Stage)');
console.log('─'.repeat(70));

for (let i = 0; i < Math.min(circles.length, texts.length); i++) {
	const name = texts[i].padEnd(20);
	const x = circles[i].cx.toFixed(1).padEnd(15);
	const y = circles[i].cy.toFixed(1).padEnd(15);
	const color = colorNames[circles[i].fill] || circles[i].fill;
	console.log(name + x + y + color);
}

// Check for overlaps
console.log('\n🔍 OVERLAP CHECK\n');
const positions = new Map();
for (let i = 0; i < circles.length; i++) {
	const key = `${circles[i].cx.toFixed(0)},${circles[i].cy.toFixed(0)}`;
	if (!positions.has(key)) {
		positions.set(key, []);
	}
	positions.get(key).push(texts[i]);
}

let hasOverlaps = false;
for (const [pos, names] of positions) {
	if (names.length > 1) {
		console.log(`⚠️  Overlap at ${pos}: ${names.join(', ')}`);
		hasOverlaps = true;
	}
}

if (!hasOverlaps) {
	console.log('✅ No overlapping components detected!');
}

// Check color distribution
console.log('\n🎨 COLOR DISTRIBUTION\n');
const colorCounts = {};
for (const circle of circles) {
	const color = colorNames[circle.fill] || circle.fill;
	colorCounts[color] = (colorCounts[color] || 0) + 1;
}

for (const [color, count] of Object.entries(colorCounts)) {
	console.log(`${color}: ${count} component(s)`);
}

console.log('\n');
