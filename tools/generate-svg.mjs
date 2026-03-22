#!/usr/bin/env node

/**
 * Wardley Map SVG Generator - Standalone Test Utility
 *
 * Generates SVG files from Wardley markdown files for testing/debugging.
 * Imports parser and renderer from src/ directly (Node v24 TS stripping).
 *
 * Usage: node generate-svg.mjs <input.md> [output.svg]
 */

import { readFileSync, writeFileSync } from 'fs';
import { parseWardleyMap } from '../src/parser.ts';
import { renderWardleyMap } from '../src/renderer.ts';

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
  node generate-svg.mjs <input.md> [output.svg]

Example:
  node generate-svg.mjs Tea-Shop.md
  node generate-svg.mjs Tea-Shop.md output.svg
		`);
		process.exit(1);
	}

	const inputFile = args[0];
	const outputFile = args[1] || inputFile.replace(/\.md$/, '.svg');

	console.log(`\n📖 Reading: ${inputFile}`);

	const markdown = readFileSync(inputFile, 'utf-8');
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

	writeFileSync(outputFile, svg, 'utf-8');

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
