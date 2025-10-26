#!/usr/bin/env node

/**
 * Wardley Map SVG Generator Test Utility
 *
 * This utility allows testing the parser and renderer independently
 * from Obsidian by generating SVG files from Wardley code.
 *
 * Usage:
 *   npm run test-svg <input.md> [output.svg]
 *
 * Or directly:
 *   node test-svg.mjs Tea-Shop.md tea-shop-output.svg
 */

import { readFileSync, writeFileSync } from 'fs';
import { parseWardleyMap } from './src/parser.ts';
import { renderWardleyMap } from './src/renderer.ts';

function extractWardleyCode(markdown) {
	// Extract code from ```wardley blocks
	const regex = /```wardley\n([\s\S]*?)\n```/g;
	const matches = [];
	let match;

	while ((match = regex.exec(markdown)) !== null) {
		matches.push(match[1]);
	}

	return matches;
}

function generateSVG(inputFile, outputFile) {
	console.log(`\n📖 Reading: ${inputFile}`);

	// Read the markdown file
	const markdown = readFileSync(inputFile, 'utf-8');

	// Extract Wardley code blocks
	const codeBlocks = extractWardleyCode(markdown);

	if (codeBlocks.length === 0) {
		console.error('❌ No ```wardley code blocks found in the file');
		process.exit(1);
	}

	console.log(`📦 Found ${codeBlocks.length} Wardley map(s)`);

	// Process each code block (for now, just the first one)
	const code = codeBlocks[0];
	console.log(`\n🔍 Parsing Wardley map...\n`);
	console.log('--- CODE ---');
	console.log(code);
	console.log('--- END CODE ---\n');

	// Parse
	const { map, errors } = parseWardleyMap(code);

	if (errors.length > 0) {
		console.error('❌ Parse errors:');
		errors.forEach(err => {
			console.error(`   Line ${err.line}: ${err.message}`);
		});
		process.exit(1);
	}

	if (!map) {
		console.error('❌ Failed to parse map');
		process.exit(1);
	}

	console.log('✅ Parsed successfully!');
	console.log(`   Title: ${map.title || '(untitled)'}`);
	console.log(`   Components: ${map.components.length}`);
	console.log(`   Dependencies: ${map.dependencies.length}`);
	console.log(`   Evolutions: ${map.evolutions.length}`);
	console.log(`   Annotations: ${map.annotations.length}`);

	console.log('\n📊 Components:');
	map.components.forEach(comp => {
		console.log(`   - ${comp.name} [${comp.stage}]${comp.isAnchor ? ' (anchor)' : ''}`);
	});

	console.log('\n🔗 Dependencies:');
	map.dependencies.forEach(dep => {
		const label = dep.label ? ` (${dep.label})` : '';
		console.log(`   - ${dep.from} -> ${dep.to}${label}`);
	});

	// Render
	console.log('\n🎨 Rendering SVG...');
	const svg = renderWardleyMap(map, {
		width: 800,
		height: 600,
		padding: 60,
		nodeRadius: 8,
		fontSize: 12,
	});

	// Write to file
	const output = outputFile || inputFile.replace(/\.md$/, '.svg');
	writeFileSync(output, svg, 'utf-8');

	console.log(`✅ SVG written to: ${output}`);
	console.log(`📏 Size: ${svg.length} bytes`);

	// Count rendered elements
	const circleCount = (svg.match(/<circle/g) || []).length;
	const lineCount = (svg.match(/<line/g) || []).length;
	const textCount = (svg.match(/<text/g) || []).length;

	console.log('\n📈 Rendered elements:');
	console.log(`   Circles: ${circleCount} (should be ${map.components.length})`);
	console.log(`   Lines: ${lineCount}`);
	console.log(`   Text labels: ${textCount}`);

	if (circleCount !== map.components.length) {
		console.warn(`\n⚠️  WARNING: Component count mismatch!`);
		console.warn(`   Declared: ${map.components.length}`);
		console.warn(`   Rendered: ${circleCount}`);
		console.warn(`   Some components may be missing or overlapping!`);
	}

	console.log('\n✨ Done! Open the SVG file in a browser to view.\n');
}

// Main
const args = process.argv.slice(2);

if (args.length === 0) {
	console.log(`
Wardley Map SVG Generator Test Utility

Usage:
  node test-svg.mjs <input.md> [output.svg]

Example:
  node test-svg.mjs Tea-Shop.md
  node test-svg.mjs Tea-Shop.md output/tea-shop.svg

The input file should contain a markdown code block with 'wardley' syntax.
If output is not specified, it will be saved as <input>.svg
	`);
	process.exit(1);
}

const [inputFile, outputFile] = args;

try {
	generateSVG(inputFile, outputFile);
} catch (error) {
	console.error('\n❌ Error:', error.message);
	console.error(error.stack);
	process.exit(1);
}
