#!/usr/bin/env node

/**
 * Wardley Map SVG Generator - Standalone Test Utility
 *
 * Generates SVG files from Wardley markdown files for testing/debugging
 *
 * Usage: node generate-svg.js <input.md> [output.svg]
 */

const fs = require('fs');
const path = require('path');

// ========== PARSER ==========

function parseWardleyMap(source) {
	const lines = source.split('\n');
	const errors = [];
	const map = {
		title: null,
		components: [],
		dependencies: [],
		evolutions: [],
		annotations: [],
		notes: [],
	};

	const componentMap = new Map();

	for (let i = 0; i < lines.length; i++) {
		const line = lines[i].trim();
		const lineNum = i + 1;

		if (!line || line.startsWith('#')) continue;

		try {
			// Title
			if (line.startsWith('title ')) {
				map.title = line.substring(6).trim();
				continue;
			}

			// Component
			const componentMatch = line.match(/^component\s+(.+?)\s+\[(\w+)\]$/);
			if (componentMatch) {
				const name = componentMatch[1].trim();
				const stage = componentMatch[2];

				if (!isValidStage(stage)) {
					errors.push({ line: lineNum, message: `Invalid evolution stage '${stage}'` });
					continue;
				}

				if (componentMap.has(name)) {
					errors.push({ line: lineNum, message: `Component '${name}' declared multiple times` });
					continue;
				}

				const component = { name, stage, isAnchor: false };
				componentMap.set(name, component);
				map.components.push(component);
				continue;
			}

			// Anchor
			const anchorMatch = line.match(/^anchor\s+(.+?)\s+\[(\w+)\]$/);
			if (anchorMatch) {
				const name = anchorMatch[1].trim();
				const stage = anchorMatch[2];

				if (!isValidStage(stage)) {
					errors.push({ line: lineNum, message: `Invalid evolution stage '${stage}'` });
					continue;
				}

				if (componentMap.has(name)) {
					errors.push({ line: lineNum, message: `Component '${name}' declared multiple times` });
					continue;
				}

				const component = { name, stage, isAnchor: true };
				componentMap.set(name, component);
				map.components.push(component);
				continue;
			}

			// Evolution
			const evolveMatch = line.match(/^evolve\s+(.+?)\s+->\s+(.+?)\s+\[(\w+)\]$/);
			if (evolveMatch) {
				const from = evolveMatch[1].trim();
				const to = evolveMatch[2].trim();
				const stage = evolveMatch[3];

				map.evolutions.push({ from, to, stage });
				continue;
			}

			// Dependencies
			if (line.includes('->')) {
				parseDependencyChain(line, lineNum, componentMap, map.dependencies, errors);
				continue;
			}

			// Annotation
			const annotationMatch = line.match(/^annotation\s+(\S+)\s+(.+)$/);
			if (annotationMatch) {
				map.annotations.push({ id: annotationMatch[1], text: annotationMatch[2] });
				continue;
			}

			// Note
			if (line.startsWith('note ')) {
				map.notes.push(line.substring(5).trim());
				continue;
			}
		} catch (e) {
			errors.push({ line: lineNum, message: `Error: ${e}` });
		}
	}

	return { map: errors.length === 0 ? map : null, errors };
}

function parseDependencyChain(line, lineNum, componentMap, dependencies, errors) {
	const parts = line.split('->');

	for (let i = 0; i < parts.length - 1; i++) {
		let from = parts[i].trim();
		let to = parts[i + 1].trim();
		let label;

		const semicolonIdx = to.indexOf(';');
		if (semicolonIdx !== -1) {
			label = to.substring(semicolonIdx + 1).trim();
			to = to.substring(0, semicolonIdx).trim();
		}

		dependencies.push({ from, to, label });
	}
}

function isValidStage(stage) {
	return ['genesis', 'custom', 'product', 'commodity'].includes(stage);
}

// ========== RENDERER ==========

const STAGE_POSITIONS = {
	genesis: 0.125,
	custom: 0.375,
	product: 0.625,
	commodity: 0.875,
};

const STAGE_LABELS = {
	genesis: 'Genesis',
	custom: 'Custom Built',
	product: 'Product',
	commodity: 'Commodity',
};

const STAGE_COLORS = {
	genesis: { fill: '#FF6B6B', stroke: '#C92A2A' },
	custom: { fill: '#4ECDC4', stroke: '#0B7285' },
	product: { fill: '#45B7D1', stroke: '#1971C2' },
	commodity: { fill: '#96CEB4', stroke: '#2F9E44' },
};

function renderWardleyMap(map, options = {}) {
	const width = options.width || 800;
	const height = options.height || 600;
	const padding = options.padding || 60;
	const nodeRadius = options.nodeRadius || 8;
	const fontSize = options.fontSize || 12;

	calculatePositions(map);

	const svg = [];

	svg.push(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" class="wardley-map">`);

	// Defs
	svg.push(`<defs>
		<marker id="arrowhead" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
			<polygon points="0 0, 10 3, 0 6" fill="#4A90E2" />
		</marker>
		<marker id="arrowhead-evolution" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
			<polygon points="0 0, 10 3, 0 6" fill="#9B59B6" />
		</marker>
	</defs>`);

	svg.push(`<rect width="${width}" height="${height}" fill="white"/>`);

	// Evolution stage grid
	const stageY = height - padding + 30;
	const stages = ['genesis', 'custom', 'product', 'commodity'];

	for (const stage of stages) {
		const x = padding + STAGE_POSITIONS[stage] * (width - 2 * padding);
		svg.push(`<line x1="${x}" y1="${padding}" x2="${x}" y2="${height - padding}" stroke="#e0e0e0" stroke-width="1" stroke-dasharray="4,4"/>`);
		svg.push(`<text x="${x}" y="${stageY}" text-anchor="middle" font-size="11" fill="#666">${STAGE_LABELS[stage]}</text>`);
	}

	// Axes labels
	svg.push(`<text x="${width / 2}" y="${height - 10}" text-anchor="middle" font-size="12" font-weight="bold" fill="#333">Evolution →</text>`);
	svg.push(`<text x="20" y="${height / 2}" text-anchor="middle" font-size="12" font-weight="bold" fill="#333" transform="rotate(-90, 20, ${height / 2})">Value Chain ↑</text>`);

	// Title
	if (map.title) {
		svg.push(`<text x="${width / 2}" y="30" text-anchor="middle" font-size="18" font-weight="bold" fill="#000">${escapeHtml(map.title)}</text>`);
	}

	// Dependencies
	for (const dep of map.dependencies) {
		const fromComp = map.components.find(c => c.name === dep.from);
		const toComp = map.components.find(c => c.name === dep.to);

		if (fromComp && toComp && fromComp.x !== undefined && fromComp.y !== undefined && toComp.x !== undefined && toComp.y !== undefined) {
			const x1 = padding + fromComp.x * (width - 2 * padding);
			const y1 = padding + fromComp.y * (height - 2 * padding - 40);
			const x2 = padding + toComp.x * (width - 2 * padding);
			const y2 = padding + toComp.y * (height - 2 * padding - 40);

			svg.push(`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#4A90E2" stroke-width="2" marker-end="url(#arrowhead)"/>`);

			if (dep.label) {
				const midX = (x1 + x2) / 2;
				const midY = (y1 + y2) / 2;
				svg.push(`<text x="${midX}" y="${midY - 5}" text-anchor="middle" font-size="10" fill="#666">${escapeHtml(dep.label)}</text>`);
			}
		}
	}

	// Evolutions
	for (const evo of map.evolutions) {
		const fromComp = map.components.find(c => c.name === evo.from);
		const toComp = map.components.find(c => c.name === evo.to);

		if (fromComp && toComp && fromComp.x !== undefined && fromComp.y !== undefined && toComp.x !== undefined && toComp.y !== undefined) {
			const x1 = padding + fromComp.x * (width - 2 * padding);
			const y1 = padding + fromComp.y * (height - 2 * padding - 40);
			const x2 = padding + toComp.x * (width - 2 * padding);
			const y2 = padding + toComp.y * (height - 2 * padding - 40);

			svg.push(`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#9B59B6" stroke-width="2" stroke-dasharray="5,5" marker-end="url(#arrowhead-evolution)"/>`);
		}
	}

	// Components
	for (const comp of map.components) {
		if (comp.x === undefined || comp.y === undefined) continue;

		const x = padding + comp.x * (width - 2 * padding);
		const y = padding + comp.y * (height - 2 * padding - 40);

		const colors = STAGE_COLORS[comp.stage];

		svg.push(`<circle cx="${x}" cy="${y}" r="${nodeRadius}" fill="${colors.fill}" stroke="${colors.stroke}" stroke-width="2"/>`);
		svg.push(`<text x="${x}" y="${y - nodeRadius - 5}" text-anchor="middle" font-size="${fontSize}" font-weight="bold" fill="#000">${escapeHtml(comp.name)}</text>`);
	}

	// Annotations
	if (map.annotations.length > 0) {
		let annotY = height - 35;
		for (const ann of map.annotations) {
			svg.push(`<text x="${padding}" y="${annotY}" font-size="10" fill="#666">[${ann.id}] ${escapeHtml(ann.text)}</text>`);
			annotY += 12;
		}
	}

	svg.push('</svg>');

	return svg.join('\n');
}

function calculatePositions(map) {
	// X-axis
	for (const comp of map.components) {
		comp.x = STAGE_POSITIONS[comp.stage];
	}

	// Y-axis
	const layers = topologicalSort(map.components, map.dependencies);
	const maxLayer = Math.max(...layers.values(), 0);

	for (const comp of map.components) {
		const layer = layers.get(comp.name) || 0;
		comp.y = (maxLayer - layer) / (maxLayer + 1);

		if (comp.isAnchor) {
			comp.y = 0;
		}
	}

	// Spread overlapping components
	spreadOverlappingComponents(map.components);
}

function spreadOverlappingComponents(components) {
	const groups = new Map();

	for (const comp of components) {
		const key = `${comp.y?.toFixed(3)}_${comp.stage}`;
		if (!groups.has(key)) {
			groups.set(key, []);
		}
		groups.get(key).push(comp);
	}

	for (const [key, group] of groups) {
		if (group.length > 1) {
			const baseX = group[0].x;
			const spreadRange = 0.08;

			group.forEach((comp, index) => {
				const offset = (index - (group.length - 1) / 2) * (spreadRange / Math.max(group.length - 1, 1));
				comp.x = baseX + offset;
			});
		}
	}
}

function topologicalSort(components, dependencies) {
	const layers = new Map();
	const inDegree = new Map();
	const graph = new Map();

	for (const comp of components) {
		inDegree.set(comp.name, 0);
		graph.set(comp.name, []);
	}

	for (const dep of dependencies) {
		graph.get(dep.to)?.push(dep.from);
		inDegree.set(dep.from, (inDegree.get(dep.from) || 0) + 1);
	}

	const queue = [];

	for (const comp of components) {
		if (inDegree.get(comp.name) === 0) {
			queue.push(comp.name);
			layers.set(comp.name, 0);
		}
	}

	while (queue.length > 0) {
		const current = queue.shift();
		const currentLayer = layers.get(current) || 0;

		for (const neighbor of graph.get(current) || []) {
			const newDegree = (inDegree.get(neighbor) || 0) - 1;
			inDegree.set(neighbor, newDegree);

			const neighborLayer = layers.get(neighbor) || 0;
			layers.set(neighbor, Math.max(neighborLayer, currentLayer + 1));

			if (newDegree === 0) {
				queue.push(neighbor);
			}
		}
	}

	return layers;
}

function escapeHtml(text) {
	return text
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#039;');
}

// ========== MAIN ==========

function extractWardleyCode(markdown) {
	const regex = /```wardley\n([\s\S]*?)\n```/g;
	const matches = [];
	let match;

	while ((match = regex.exec(markdown)) !== null) {
		matches.push(match[1]);
	}

	return matches;
}

function main() {
	const args = process.argv.slice(2);

	if (args.length === 0) {
		console.log(`
Wardley Map SVG Generator

Usage:
  node generate-svg.js <input.md> [output.svg]

Example:
  node generate-svg.js Tea-Shop.md
  node generate-svg.js Tea-Shop.md output.svg
		`);
		process.exit(1);
	}

	const inputFile = args[0];
	const outputFile = args[1] || inputFile.replace(/\.md$/, '.svg');

	console.log(`\n📖 Reading: ${inputFile}`);

	const markdown = fs.readFileSync(inputFile, 'utf-8');
	const codeBlocks = extractWardleyCode(markdown);

	if (codeBlocks.length === 0) {
		console.error('❌ No ```wardley code blocks found');
		process.exit(1);
	}

	console.log(`📦 Found ${codeBlocks.length} Wardley map(s)\n`);

	const code = codeBlocks[0];
	const { map, errors } = parseWardleyMap(code);

	if (errors.length > 0) {
		console.error('❌ Parse errors:');
		errors.forEach(err => console.error(`   Line ${err.line}: ${err.message}`));
		process.exit(1);
	}

	console.log('✅ Parsed successfully!');
	console.log(`   Title: ${map.title || '(untitled)'}`);
	console.log(`   Components: ${map.components.length}`);
	console.log(`   Dependencies: ${map.dependencies.length}\n`);

	console.log('📊 Components:');
	map.components.forEach(comp => {
		console.log(`   ${comp.isAnchor ? '⚓' : '●'} ${comp.name} [${comp.stage}]`);
	});

	console.log('\n🎨 Rendering SVG...');
	const svg = renderWardleyMap(map);

	fs.writeFileSync(outputFile, svg, 'utf-8');

	const circleCount = (svg.match(/<circle/g) || []).length;

	console.log(`✅ SVG written to: ${outputFile}`);
	console.log(`📏 Components rendered: ${circleCount}/${map.components.length}\n`);

	if (circleCount !== map.components.length) {
		console.warn(`⚠️  WARNING: Component count mismatch!`);
	} else {
		console.log('✨ All components rendered successfully!\n');
	}
}

main();
