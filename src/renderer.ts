import type {
	WardleyMap,
	Component,
	Dependency,
	Evolution,
	EvolutionStage,
} from "./types";

const STAGE_POSITIONS: Record<EvolutionStage, number> = {
	genesis: 0.125, // 12.5% (centered in 0-25%)
	custom: 0.375, // 37.5% (centered in 25-50%)
	product: 0.625, // 62.5% (centered in 50-75%)
	commodity: 0.875, // 87.5% (centered in 75-100%)
};

const STAGE_LABELS: Record<EvolutionStage, string> = {
	genesis: "Genesis",
	custom: "Custom Built",
	product: "Product",
	commodity: "Commodity",
};

// Color scheme for evolution stages
const STAGE_COLORS: Record<EvolutionStage, { fill: string; stroke: string }> = {
	genesis: { fill: "#FF6B6B", stroke: "#C92A2A" }, // Red - novel, uncertain
	custom: { fill: "#4ECDC4", stroke: "#0B7285" }, // Teal - custom built
	product: { fill: "#45B7D1", stroke: "#1971C2" }, // Blue - product
	commodity: { fill: "#96CEB4", stroke: "#2F9E44" }, // Green - commodity
};

export interface RenderOptions {
	width?: number;
	height?: number;
	padding?: number;
	nodeRadius?: number;
	fontSize?: number;
}

/**
 * Render a Wardley Map as SVG
 */
export function renderWardleyMap(
	map: WardleyMap,
	options: RenderOptions = {}
): string {
	const width = options.width ?? 800;
	const height = options.height ?? 600;
	const padding = options.padding ?? 60;
	const nodeRadius = options.nodeRadius ?? 8;
	const fontSize = options.fontSize ?? 12;

	// Calculate positions
	calculatePositions(map);

	const svg: string[] = [];

	// SVG header
	svg.push(
		`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" class="wardley-map">`
	);

	// Arrow marker definitions (must be at the beginning)
	svg.push(`<defs>
		<marker id="arrowhead" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
			<polygon points="0 0, 10 3, 0 6" fill="#4A90E2" />
		</marker>
		<marker id="arrowhead-evolution" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
			<polygon points="0 0, 10 3, 0 6" fill="#9B59B6" />
		</marker>
	</defs>`);

	// Background
	svg.push(`<rect width="${width}" height="${height}" fill="white"/>`);

	// Evolution stage labels and grid lines
	const stageY = height - padding + 30;
	const stages: EvolutionStage[] = ["genesis", "custom", "product", "commodity"];

	for (const stage of stages) {
		const x = padding + STAGE_POSITIONS[stage] * (width - 2 * padding);

		// Vertical grid line
		svg.push(
			`<line x1="${x}" y1="${padding}" x2="${x}" y2="${height - padding}" stroke="#e0e0e0" stroke-width="1" stroke-dasharray="4,4"/>`
		);

		// Stage label
		svg.push(
			`<text x="${x}" y="${stageY}" text-anchor="middle" font-size="11" fill="#666">${STAGE_LABELS[stage]}</text>`
		);
	}

	// Axes labels
	svg.push(
		`<text x="${width / 2}" y="${height - 10}" text-anchor="middle" font-size="12" font-weight="bold" fill="#333">Evolution →</text>`
	);
	svg.push(
		`<text x="20" y="${height / 2}" text-anchor="middle" font-size="12" font-weight="bold" fill="#333" transform="rotate(-90, 20, ${height / 2})">Value Chain ↑</text>`
	);

	// Title
	if (map.title) {
		svg.push(
			`<text x="${width / 2}" y="30" text-anchor="middle" font-size="18" font-weight="bold" fill="#000">${escapeHtml(map.title)}</text>`
		);
	}

	// Draw dependencies first (so they appear behind components)
	for (const dep of map.dependencies) {
		const fromComp = map.components.find((c) => c.name === dep.from);
		const toComp = map.components.find((c) => c.name === dep.to);

		if (fromComp && toComp && fromComp.x !== undefined && fromComp.y !== undefined && toComp.x !== undefined && toComp.y !== undefined) {
			const x1 = padding + fromComp.x * (width - 2 * padding);
			const y1 = padding + fromComp.y * (height - 2 * padding - 40);
			const x2 = padding + toComp.x * (width - 2 * padding);
			const y2 = padding + toComp.y * (height - 2 * padding - 40);

			// Arrow
			svg.push(
				`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#4A90E2" stroke-width="2" marker-end="url(#arrowhead)"/>`
			);

			// Label
			if (dep.label) {
				const midX = (x1 + x2) / 2;
				const midY = (y1 + y2) / 2;
				svg.push(
					`<text x="${midX}" y="${midY - 5}" text-anchor="middle" font-size="10" fill="#666">${escapeHtml(dep.label)}</text>`
				);
			}
		}
	}

	// Draw evolution relationships
	for (const evo of map.evolutions) {
		const fromComp = map.components.find((c) => c.name === evo.from);
		const toComp = map.components.find((c) => c.name === evo.to);

		if (fromComp && toComp && fromComp.x !== undefined && fromComp.y !== undefined && toComp.x !== undefined && toComp.y !== undefined) {
			const x1 = padding + fromComp.x * (width - 2 * padding);
			const y1 = padding + fromComp.y * (height - 2 * padding - 40);
			const x2 = padding + toComp.x * (width - 2 * padding);
			const y2 = padding + toComp.y * (height - 2 * padding - 40);

			// Dashed arrow
			svg.push(
				`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#9B59B6" stroke-width="2" stroke-dasharray="5,5" marker-end="url(#arrowhead-evolution)"/>`
			);
		}
	}

	// Draw components
	for (const comp of map.components) {
		if (comp.x === undefined || comp.y === undefined) {
			console.warn(`Skipping component ${comp.name} - x: ${comp.x}, y: ${comp.y}`);
			continue;
		}

		const x = padding + comp.x * (width - 2 * padding);
		const y = padding + comp.y * (height - 2 * padding - 40);

		// Component circle - color based on evolution stage
		const colors = getStageColors(comp.stage);
		const fillColor = colors.fill;
		const strokeColor = colors.stroke;

		svg.push(
			`<circle cx="${x}" cy="${y}" r="${nodeRadius}" fill="${fillColor}" stroke="${strokeColor}" stroke-width="2" class="${comp.isAnchor ? 'anchor' : 'component'}"/>`
		);

		// Component label
		svg.push(
			`<text x="${x}" y="${y - nodeRadius - 5}" text-anchor="middle" font-size="${fontSize}" font-weight="bold" fill="#000">${escapeHtml(comp.name)}</text>`
		);
	}

	// Annotations (bottom)
	if (map.annotations.length > 0) {
		let annotY = height - 35;
		for (const ann of map.annotations) {
			svg.push(
				`<text x="${padding}" y="${annotY}" font-size="10" fill="#666">[${ann.id}] ${escapeHtml(ann.text)}</text>`
			);
			annotY += 12;
		}
	}

	svg.push("</svg>");

	return svg.join("\n");
}

/**
 * Get colors for a component based on its evolution stage
 */
function getStageColors(stage: EvolutionStage): { fill: string; stroke: string } {
	return STAGE_COLORS[stage];
}

/**
 * Calculate X and Y positions for all components
 */
function calculatePositions(map: WardleyMap): void {
	// X-axis: Based on evolution stage (initial positioning)
	for (const comp of map.components) {
		comp.x = STAGE_POSITIONS[comp.stage];
	}

	// Y-axis: Based on topological sorting of dependencies
	const layers = topologicalSort(map.components, map.dependencies);

	// Assign Y positions based on layers (top to bottom)
	const maxLayer = Math.max(...layers.values(), 0);

	for (const comp of map.components) {
		const layer = layers.get(comp.name) ?? 0;
		// Invert Y so anchors (high in value chain) are at top
		comp.y = (maxLayer - layer) / (maxLayer + 1);

		// Anchors should always be at the top
		if (comp.isAnchor) {
			comp.y = 0;
		}
	}

	// Evolved components inherit Y position from their source
	// Evolution represents maturity (X-axis), not value chain changes (Y-axis)
	for (const evo of map.evolutions) {
		const sourceComp = map.components.find((c) => c.name === evo.from);
		const targetComp = map.components.find((c) => c.name === evo.to);

		if (sourceComp && targetComp && sourceComp.y !== undefined) {
			// Target inherits source's Y position
			targetComp.y = sourceComp.y;
		}
	}

	// Spread components horizontally if they overlap at the same stage/layer
	spreadOverlappingComponents(map.components);

	// Debug logging
	for (const comp of map.components) {
		console.log(`Component: ${comp.name}, x: ${comp.x}, y: ${comp.y}, stage: ${comp.stage}, isAnchor: ${comp.isAnchor}`);
	}
}

/**
 * Spread components horizontally within their evolution stage if they overlap
 */
function spreadOverlappingComponents(components: Component[]): void {
	// Group components by their y position and stage
	const groups = new Map<string, Component[]>();

	for (const comp of components) {
		const key = `${comp.y?.toFixed(3)}_${comp.stage}`;
		if (!groups.has(key)) {
			groups.set(key, []);
		}
		groups.get(key)!.push(comp);
	}

	// For each group with multiple components, spread them horizontally
	for (const [key, group] of groups) {
		if (group.length > 1) {
			const baseX = group[0].x!;

			// Adaptive spread based on group size - more components = wider spread
			// Base spread is 0.12 (12%), increased for larger groups
			const baseSpread = 0.12;
			const spreadMultiplier = Math.max(1, group.length / 3);
			const spreadRange = baseSpread * spreadMultiplier;

			group.forEach((comp, index) => {
				const offset = (index - (group.length - 1) / 2) * (spreadRange / Math.max(group.length - 1, 1));
				comp.x = baseX + offset;
			});
		}
	}
}

/**
 * Topological sort to determine Y-axis positioning
 * Returns a map of component name to layer number (0 = bottom, higher = top)
 */
function topologicalSort(
	components: Component[],
	dependencies: Dependency[]
): Map<string, number> {
	const layers = new Map<string, number>();
	const inDegree = new Map<string, number>();
	const graph = new Map<string, string[]>();

	// Initialize
	for (const comp of components) {
		inDegree.set(comp.name, 0);
		graph.set(comp.name, []);
	}

	// Build graph (reversed: dependencies point upward in value chain)
	for (const dep of dependencies) {
		graph.get(dep.to)?.push(dep.from);
		inDegree.set(dep.from, (inDegree.get(dep.from) ?? 0) + 1);
	}

	// BFS to assign layers
	const queue: string[] = [];

	// Start with nodes that have no dependencies (bottom of value chain)
	for (const comp of components) {
		if (inDegree.get(comp.name) === 0) {
			queue.push(comp.name);
			layers.set(comp.name, 0);
		}
	}

	while (queue.length > 0) {
		const current = queue.shift()!;
		const currentLayer = layers.get(current) ?? 0;

		for (const neighbor of graph.get(current) ?? []) {
			const newDegree = (inDegree.get(neighbor) ?? 0) - 1;
			inDegree.set(neighbor, newDegree);

			const neighborLayer = layers.get(neighbor) ?? 0;
			layers.set(neighbor, Math.max(neighborLayer, currentLayer + 1));

			if (newDegree === 0) {
				queue.push(neighbor);
			}
		}
	}

	return layers;
}

/**
 * Escape HTML special characters
 */
function escapeHtml(text: string): string {
	return text
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#039;");
}
