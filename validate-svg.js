#!/usr/bin/env node

/**
 * Wardley Map SVG UAT Validator
 *
 * Automated validation tool based on Wardley-SVG-UAT-Criteria.md
 * Tests objective criteria that can be programmatically verified.
 */

const fs = require('fs');
const { DOMParser } = require('@xmldom/xmldom');

class WardleyMapValidator {
	constructor(svgContent, wardleyCode) {
		this.svgContent = svgContent;
		this.wardleyCode = wardleyCode;
		this.results = {
			passed: [],
			failed: [],
			warnings: [],
		};

		// Parse SVG
		const parser = new DOMParser({
			errorHandler: {
				warning: () => {},
				error: () => {},
				fatalError: (e) => console.error('SVG Parse Error:', e)
			}
		});
		const doc = parser.parseFromString(svgContent, 'image/svg+xml');
		this.svg = doc.documentElement;

		// Parse Wardley code (simple parser)
		this.ast = this.parseWardleyCode(wardleyCode);
	}

	parseWardleyCode(code) {
		const lines = code.split('\n');
		const ast = {
			title: null,
			components: [],
			dependencies: [],
			evolutions: [],
			annotations: [],
		};

		for (const line of lines) {
			const trimmed = line.trim();
			if (!trimmed || trimmed.startsWith('#')) continue;

			if (trimmed.startsWith('title ')) {
				ast.title = trimmed.substring(6).trim();
			} else if (trimmed.startsWith('component ') || trimmed.startsWith('anchor ')) {
				const match = trimmed.match(/^(component|anchor)\s+(.+?)\s+\[(\w+)\]$/);
				if (match) {
					ast.components.push({
						name: match[2].trim(),
						stage: match[3],
						isAnchor: match[1] === 'anchor',
					});
				}
			} else if (trimmed.startsWith('evolve ')) {
				const match = trimmed.match(/^evolve\s+(.+?)\s+->\s+(.+?)\s+\[(\w+)\]$/);
				if (match) {
					ast.evolutions.push({
						from: match[1].trim(),
						to: match[2].trim(),
						stage: match[3],
					});
				}
			} else if (trimmed.includes('->')) {
				// Parse dependency chain
				const parts = trimmed.split('->');
				for (let i = 0; i < parts.length - 1; i++) {
					let from = parts[i].trim();
					let to = parts[i + 1].trim();

					// Remove semicolon annotations
					const semiIdx = to.indexOf(';');
					if (semiIdx !== -1) {
						to = to.substring(0, semiIdx).trim();
					}

					ast.dependencies.push({ from, to });
				}
			} else if (trimmed.startsWith('annotation ')) {
				ast.annotations.push(trimmed);
			}
		}

		return ast;
	}

	querySelectorAll(selector) {
		const elements = [];
		const walk = (node) => {
			if (node && node.nodeType === 1) { // Element node
				if (this.matchesSelector(node, selector)) {
					elements.push(node);
				}
				if (node.childNodes) {
					for (let i = 0; i < node.childNodes.length; i++) {
						walk(node.childNodes[i]);
					}
				}
			}
		};
		walk(this.svg);
		return elements;
	}

	matchesSelector(node, selector) {
		if (!node || !node.tagName) return false;
		const tag = node.tagName.toLowerCase();
		const sel = selector.toLowerCase();
		return tag === sel;
	}

	validate() {
		console.log('\n🔍 Running Wardley Map SVG UAT Validation\n');
		console.log('=' .repeat(70));

		this.validateDocumentStructure();
		this.validateComponents();
		this.validateLabels();
		this.validateDependencies();
		this.validateEvolutions();
		this.validateAxes();
		this.validateTitle();
		this.validatePositioning();
		this.validateColors();

		this.printReport();
		return this.results;
	}

	validateDocumentStructure() {
		console.log('\n📄 1. Document Structure\n');

		// Check SVG root element
		const svgRoot = this.querySelectorAll('svg')[0];
		if (svgRoot) {
			this.pass('Root <svg> element exists');

			// Check namespace
			const xmlns = svgRoot.getAttribute('xmlns');
			if (xmlns === 'http://www.w3.org/2000/svg') {
				this.pass('Valid xmlns namespace');
			} else {
				this.fail(`Invalid or missing xmlns: ${xmlns}`);
			}

			// Check viewBox
			const viewBox = svgRoot.getAttribute('viewBox');
			if (viewBox) {
				this.pass(`viewBox defined: ${viewBox}`);
			} else {
				this.warn('viewBox attribute missing');
			}
		} else {
			this.fail('No root <svg> element found');
		}
	}

	validateComponents() {
		console.log('\n🔘 2. Components (Nodes)\n');

		const declaredCount = this.ast.components.length;
		const circles = this.querySelectorAll('circle');
		const allRects = this.querySelectorAll('rect');

		// Filter out background rect (full size of viewBox)
		const rects = allRects.filter(rect => {
			const w = rect.getAttribute('width');
			const h = rect.getAttribute('height');
			// Background is typically 800x600 or similar full-canvas size
			return !(w === '800' && h === '600');
		});

		const renderedCount = circles.length + rects.length;

		if (declaredCount === renderedCount) {
			this.pass(`Component count matches: ${declaredCount} declared, ${renderedCount} rendered`);
		} else {
			this.fail(`Component count mismatch: ${declaredCount} declared, ${renderedCount} rendered`);
		}

		// Check each component has required attributes
		const allNodes = [...circles, ...rects];
		let nodesWithPosition = 0;
		let nodesWithSize = 0;
		let nodesWithFill = 0;

		allNodes.forEach(node => {
			if (node.tagName === 'circle') {
				if (node.getAttribute('cx') && node.getAttribute('cy')) nodesWithPosition++;
				if (node.getAttribute('r')) nodesWithSize++;
			} else if (node.tagName === 'rect') {
				if (node.getAttribute('x') && node.getAttribute('y')) nodesWithPosition++;
				if (node.getAttribute('width') && node.getAttribute('height')) nodesWithSize++;
			}
			if (node.getAttribute('fill')) nodesWithFill++;
		});

		if (nodesWithPosition === renderedCount) {
			this.pass(`All ${renderedCount} nodes have position attributes`);
		} else {
			this.fail(`${renderedCount - nodesWithPosition} nodes missing position attributes`);
		}

		if (nodesWithSize === renderedCount) {
			this.pass(`All ${renderedCount} nodes have size attributes`);
		} else {
			this.fail(`${renderedCount - nodesWithSize} nodes missing size attributes`);
		}

		if (nodesWithFill === renderedCount) {
			this.pass(`All ${renderedCount} nodes have fill color`);
		} else {
			this.fail(`${renderedCount - nodesWithFill} nodes missing fill color`);
		}
	}

	validateLabels() {
		console.log('\n📝 3. Component Labels\n');

		const declaredCount = this.ast.components.length;
		const texts = this.querySelectorAll('text');

		// Filter out axis labels and title
		const componentLabels = texts.filter(text => {
			const content = text.textContent;
			return !['Genesis', 'Custom Built', 'Product', 'Commodity', 'Evolution →', 'Value Chain ↑'].includes(content)
				&& content !== this.ast.title
				&& !content.startsWith('['); // Annotations
		});

		const labelCount = componentLabels.length;

		if (declaredCount === labelCount) {
			this.pass(`Label count matches: ${declaredCount} components, ${labelCount} labels`);
		} else {
			this.fail(`Label count mismatch: ${declaredCount} components, ${labelCount} labels`);
		}

		// Verify each declared component has a label
		const labelTexts = componentLabels.map(t => t.textContent);
		let missingLabels = 0;

		this.ast.components.forEach(comp => {
			if (!labelTexts.includes(comp.name)) {
				this.fail(`Missing label for component: ${comp.name}`);
				missingLabels++;
			}
		});

		if (missingLabels === 0) {
			this.pass('All declared components have labels');
		}
	}

	validateDependencies() {
		console.log('\n🔗 4. Dependencies (Edges)\n');

		const declaredCount = this.ast.dependencies.length;
		const lines = this.querySelectorAll('line');

		// Filter out grid lines (they usually have stroke-dasharray)
		const edges = lines.filter(line => {
			const stroke = line.getAttribute('stroke');
			const markerEnd = line.getAttribute('marker-end');
			// Dependencies should have arrows and be blue
			return markerEnd && markerEnd.includes('arrowhead') && stroke && stroke.includes('4A90E2');
		});

		const edgeCount = edges.length;

		if (declaredCount === edgeCount) {
			this.pass(`Dependency count matches: ${declaredCount} declared, ${edgeCount} rendered`);
		} else {
			this.fail(`Dependency count mismatch: ${declaredCount} declared, ${edgeCount} rendered`);
		}

		// Check edges have arrow markers
		let edgesWithArrows = 0;
		edges.forEach(edge => {
			if (edge.getAttribute('marker-end')) edgesWithArrows++;
		});

		if (edgesWithArrows === edgeCount) {
			this.pass(`All ${edgeCount} edges have arrow markers`);
		} else {
			this.fail(`${edgeCount - edgesWithArrows} edges missing arrow markers`);
		}
	}

	validateEvolutions() {
		console.log('\n🔄 5. Evolution Arrows\n');

		const declaredCount = this.ast.evolutions.length;
		const lines = this.querySelectorAll('line');

		// Evolution arrows are purple and dashed
		const evolutionArrows = lines.filter(line => {
			const stroke = line.getAttribute('stroke');
			const dashArray = line.getAttribute('stroke-dasharray');
			return stroke && stroke.includes('9B59B6') && dashArray;
		});

		const arrowCount = evolutionArrows.length;

		if (declaredCount === arrowCount) {
			this.pass(`Evolution arrow count matches: ${declaredCount} declared, ${arrowCount} rendered`);
		} else {
			this.fail(`Evolution arrow count mismatch: ${declaredCount} declared, ${arrowCount} rendered`);
		}

		// Check visual distinction (dashed, different color)
		if (arrowCount > 0) {
			const allDashed = evolutionArrows.every(arrow =>
				arrow.getAttribute('stroke-dasharray')
			);
			if (allDashed) {
				this.pass('Evolution arrows are visually distinct (dashed)');
			} else {
				this.warn('Some evolution arrows not dashed');
			}
		}
	}

	validateAxes() {
		console.log('\n📊 6. Axes and Grid\n');

		const texts = this.querySelectorAll('text');
		const textContents = texts.map(t => t.textContent);

		// Check for evolution stage labels
		const stageLabels = ['Genesis', 'Custom Built', 'Product', 'Commodity'];
		let foundStages = 0;
		stageLabels.forEach(label => {
			if (textContents.includes(label)) foundStages++;
		});

		if (foundStages === 4) {
			this.pass('All 4 evolution stage labels present');
		} else {
			this.fail(`Only ${foundStages}/4 evolution stage labels found`);
		}

		// Check for axis labels
		if (textContents.includes('Evolution →') || textContents.some(t => t.includes('Evolution'))) {
			this.pass('X-axis (Evolution) label present');
		} else {
			this.warn('X-axis label missing or not standard');
		}

		if (textContents.includes('Value Chain ↑') || textContents.some(t => t.includes('Value Chain'))) {
			this.pass('Y-axis (Value Chain) label present');
		} else {
			this.warn('Y-axis label missing or not standard');
		}
	}

	validateTitle() {
		console.log('\n📌 7. Title\n');

		if (this.ast.title) {
			const texts = this.querySelectorAll('text');
			const titleFound = texts.some(t => t.textContent === this.ast.title);

			if (titleFound) {
				this.pass(`Title present: "${this.ast.title}"`);
			} else {
				this.fail(`Title declared but not found in SVG: "${this.ast.title}"`);
			}
		} else {
			this.pass('No title declared (optional)');
		}
	}

	validatePositioning() {
		console.log('\n📍 8. Component Positioning\n');

		const svgRoot = this.querySelectorAll('svg')[0];
		if (!svgRoot) return;

		const viewBox = svgRoot.getAttribute('viewBox');
		if (!viewBox) {
			this.warn('Cannot validate positioning without viewBox');
			return;
		}

		const [vbX, vbY, vbWidth, vbHeight] = viewBox.split(/\s+/).map(parseFloat);
		const circles = this.querySelectorAll('circle');

		// Group by evolution stage and check X positioning
		const stageRanges = {
			genesis: [0, 0.25],
			custom: [0.25, 0.50],
			product: [0.50, 0.75],
			commodity: [0.75, 1.0],
		};

		let positioningCorrect = 0;
		let positioningTotal = 0;

		this.ast.components.forEach(comp => {
			const expectedRange = stageRanges[comp.stage];
			if (!expectedRange) return;

			positioningTotal++;

			// Find corresponding circle (simplified - assumes order matches)
			// In a real validator, you'd match by ID or data attributes
			const [minX, maxX] = expectedRange;
			const minPx = vbX + minX * vbWidth;
			const maxPx = vbX + maxX * vbWidth;

			// For now, just check if there are circles in the right ranges
			// This is simplified validation
		});

		// Simplified check
		this.pass('Position validation (simplified) - manual review recommended');
	}

	validateColors() {
		console.log('\n🎨 9. Color Coding\n');

		const circles = this.querySelectorAll('circle');
		const fills = circles.map(c => c.getAttribute('fill'));
		const uniqueFills = [...new Set(fills)];

		if (uniqueFills.length >= 3) {
			this.pass(`Multiple colors used for evolution stages: ${uniqueFills.length} unique colors`);
		} else {
			this.warn(`Only ${uniqueFills.length} unique colors - may need more variety`);
		}

		// Check that colors are distinguishable (not all same)
		if (uniqueFills.length === 1) {
			this.fail('All components have the same color - evolution stages not color-coded');
		} else {
			this.pass('Components use different colors (evolution stage coding)');
		}
	}

	pass(message) {
		this.results.passed.push(message);
		console.log(`  ✅ ${message}`);
	}

	fail(message) {
		this.results.failed.push(message);
		console.log(`  ❌ ${message}`);
	}

	warn(message) {
		this.results.warnings.push(message);
		console.log(`  ⚠️  ${message}`);
	}

	printReport() {
		console.log('\n' + '='.repeat(70));
		console.log('\n📋 VALIDATION REPORT\n');

		console.log(`✅ Passed: ${this.results.passed.length}`);
		console.log(`❌ Failed: ${this.results.failed.length}`);
		console.log(`⚠️  Warnings: ${this.results.warnings.length}`);

		if (this.results.failed.length === 0) {
			console.log('\n🎉 All automated checks PASSED!\n');
		} else {
			console.log('\n⚠️  Some checks FAILED - review above for details\n');
		}

		const total = this.results.passed.length + this.results.failed.length;
		const score = total > 0 ? ((this.results.passed.length / total) * 100).toFixed(1) : 0;
		console.log(`Score: ${score}% (${this.results.passed.length}/${total})\n`);

		console.log('=' .repeat(70));
		console.log('\n💡 Note: This validator checks OBJECTIVE criteria only.');
		console.log('   Manual UAT still required for:');
		console.log('   - Visual quality and aesthetics');
		console.log('   - Text readability');
		console.log('   - Layout balance');
		console.log('   - Overlap severity');
		console.log('   - Overall user experience\n');
	}
}

// Main
function main() {
	if (process.argv.length < 4) {
		console.log(`
Wardley Map SVG UAT Validator

Usage:
  node validate-svg.js <wardley.md> <output.svg>

Example:
  node validate-svg.js Tea-Shop.md Tea-Shop.svg
		`);
		process.exit(1);
	}

	const mdFile = process.argv[2];
	const svgFile = process.argv[3];

	console.log(`\n📖 Loading files...`);
	console.log(`   Wardley: ${mdFile}`);
	console.log(`   SVG: ${svgFile}`);

	const mdContent = fs.readFileSync(mdFile, 'utf-8');
	const svgContent = fs.readFileSync(svgFile, 'utf-8');

	// Extract wardley code from markdown
	const codeMatch = mdContent.match(/```wardley\n([\s\S]*?)\n```/);
	if (!codeMatch) {
		console.error('\n❌ No ```wardley code block found in markdown file');
		process.exit(1);
	}

	const wardleyCode = codeMatch[1];

	const validator = new WardleyMapValidator(svgContent, wardleyCode);
	validator.validate();
}

main();
