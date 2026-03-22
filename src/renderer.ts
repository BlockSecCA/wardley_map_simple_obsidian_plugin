import type {
	WardleyMap,
	Component,
	Dependency,
	Evolution,
	EvolveTo,
	Flow,
	Pipeline,
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

	// Arrow marker definitions
	svg.push(`<defs>
		<marker id="arrowhead" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto" markerUnits="strokeWidth">
			<polygon points="0 0, 10 3.5, 0 7" fill="#4A90E2" />
		</marker>
		<marker id="arrowhead-evolution" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto" markerUnits="strokeWidth">
			<polygon points="0 0, 10 3.5, 0 7" fill="#9B59B6" />
		</marker>
		<marker id="arrowhead-flow" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto" markerUnits="strokeWidth">
			<polygon points="0 0, 10 3.5, 0 7" fill="#E67E22" />
		</marker>
		<marker id="arrowhead-flow-start" markerWidth="10" markerHeight="7" refX="0" refY="3.5" orient="auto" markerUnits="strokeWidth">
			<polygon points="10 0, 0 3.5, 10 7" fill="#E67E22" />
		</marker>
	</defs>`);

	// Background
	svg.push(`<rect width="${width}" height="${height}" fill="white" class="wardley-background"/>`);

	// Helper: convert normalized coords to pixel coords
	const px = (nx: number) => padding + nx * (width - 2 * padding);
	const py = (ny: number) => padding + ny * (height - 2 * padding - 40);

	// Evolution stage labels and grid lines
	const stageY = height - padding + 30;
	const stages: EvolutionStage[] = ["genesis", "custom", "product", "commodity"];

	for (const stage of stages) {
		const x = px(STAGE_POSITIONS[stage]);

		svg.push(
			`<line x1="${x}" y1="${padding}" x2="${x}" y2="${height - padding}" stroke="#e0e0e0" stroke-width="1" stroke-dasharray="4,4" class="wardley-grid"/>`
		);
		svg.push(
			`<text x="${x}" y="${stageY}" text-anchor="middle" font-size="11" fill="#666" class="wardley-stage-label">${STAGE_LABELS[stage]}</text>`
		);
	}

	// Axes labels
	svg.push(
		`<text x="${width / 2}" y="${height - 10}" text-anchor="middle" font-size="12" font-weight="bold" fill="#333" class="wardley-axis-label">Evolution \u2192</text>`
	);
	svg.push(
		`<text x="20" y="${height / 2}" text-anchor="middle" font-size="12" font-weight="bold" fill="#333" transform="rotate(-90, 20, ${height / 2})" class="wardley-axis-label">Value Chain \u2191</text>`
	);

	// Title
	if (map.title) {
		svg.push(
			`<text x="${width / 2}" y="30" text-anchor="middle" font-size="18" font-weight="bold" fill="#000" class="wardley-title">${escapeHtml(map.title)}</text>`
		);
	}

	// Draw dependencies (behind components)
	for (const dep of map.dependencies) {
		const fromComp = map.components.find((c) => c.name === dep.from);
		const toComp = map.components.find((c) => c.name === dep.to);

		if (fromComp && toComp && fromComp.x !== undefined && fromComp.y !== undefined && toComp.x !== undefined && toComp.y !== undefined) {
			const [x1, y1, x2, y2] = edgeCoords(
				px(fromComp.x), py(fromComp.y),
				px(toComp.x), py(toComp.y),
				nodeRadius
			);

			svg.push(
				`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#4A90E2" stroke-width="2" marker-end="url(#arrowhead)" class="wardley-edge wardley-dependency"/>`
			);

			if (dep.label) {
				const midX = (x1 + x2) / 2;
				const midY = (y1 + y2) / 2;
				svg.push(
					`<text x="${midX}" y="${midY - 5}" text-anchor="middle" font-size="10" fill="#666" class="wardley-edge-label">${escapeHtml(dep.label)}</text>`
				);
			}
		}
	}

	// Draw evolution relationships
	for (const evo of map.evolutions) {
		const fromComp = map.components.find((c) => c.name === evo.from);
		const toComp = map.components.find((c) => c.name === evo.to);

		if (fromComp && toComp && fromComp.x !== undefined && fromComp.y !== undefined && toComp.x !== undefined && toComp.y !== undefined) {
			const [x1, y1, x2, y2] = edgeCoords(
				px(fromComp.x), py(fromComp.y),
				px(toComp.x), py(toComp.y),
				nodeRadius
			);

			svg.push(
				`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#9B59B6" stroke-width="2" stroke-dasharray="5,5" marker-end="url(#arrowhead-evolution)" class="wardley-edge wardley-evolution"/>`
			);
		}
	}

	// Draw evolve-to arrows (component evolving to a new stage position)
	for (const eto of map.evolveTos) {
		const comp = map.components.find((c) => c.name === eto.component);
		if (comp && comp.x !== undefined && comp.y !== undefined) {
			const x1 = px(comp.x) + nodeRadius;
			const y1 = py(comp.y);
			const x2 = px(STAGE_POSITIONS[eto.targetStage]);
			const y2 = y1; // same Y (evolution is horizontal)

			if (x2 > x1) {
				svg.push(
					`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#9B59B6" stroke-width="2" stroke-dasharray="5,5" marker-end="url(#arrowhead-evolution)" class="wardley-edge wardley-evolve-to"/>`
				);
				// Small open circle at target
				svg.push(
					`<circle cx="${x2}" cy="${y2}" r="4" fill="white" stroke="#9B59B6" stroke-width="2" class="wardley-evolve-target"/>`
				);
			}
		}
	}

	// Draw flow arrows
	for (const flow of map.flows) {
		const fromComp = map.components.find((c) => c.name === flow.from);
		const toComp = map.components.find((c) => c.name === flow.to);

		if (fromComp && toComp && fromComp.x !== undefined && fromComp.y !== undefined && toComp.x !== undefined && toComp.y !== undefined) {
			const [x1, y1, x2, y2] = edgeCoords(
				px(fromComp.x), py(fromComp.y),
				px(toComp.x), py(toComp.y),
				nodeRadius
			);

			let markers = 'marker-end="url(#arrowhead-flow)"';
			if (flow.direction === "backward") {
				markers = 'marker-start="url(#arrowhead-flow-start)"';
			} else if (flow.direction === "bidirectional") {
				markers = 'marker-start="url(#arrowhead-flow-start)" marker-end="url(#arrowhead-flow)"';
			}

			svg.push(
				`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#E67E22" stroke-width="2" ${markers} class="wardley-edge wardley-flow wardley-flow-${flow.direction}"/>`
			);

			if (flow.label) {
				const midX = (x1 + x2) / 2;
				const midY = (y1 + y2) / 2;
				svg.push(
					`<text x="${midX}" y="${midY - 5}" text-anchor="middle" font-size="10" fill="#E67E22" class="wardley-edge-label wardley-flow-label">${escapeHtml(flow.label)}</text>`
				);
			}
		}
	}

	// Draw pipeline boxes (behind components)
	const pipelineBoxHeight = 30; // half-height above and below the Y line
	for (const pipeline of map.pipelines) {
		const parent = map.components.find((c) => c.name === pipeline.parent);
		if (!parent || parent.x === undefined || parent.y === undefined) continue;
		if (pipeline.subComponents.length === 0) continue;

		const subs = pipeline.subComponents
			.map((n) => map.components.find((c) => c.name === n))
			.filter((c): c is Component => c !== undefined && c.x !== undefined);

		if (subs.length === 0) continue;

		const minX = Math.min(...subs.map((c) => px(c.x!)));
		const maxX = Math.max(...subs.map((c) => px(c.x!)));
		const centerY = py(parent.y);
		const boxPad = 20;

		const boxX = minX - boxPad;
		const boxY = centerY - pipelineBoxHeight;
		const boxW = maxX - minX + boxPad * 2;
		const boxH = pipelineBoxHeight * 2;

		svg.push(
			`<rect x="${boxX}" y="${boxY}" width="${boxW}" height="${boxH}" rx="6" ry="6" fill="#f8f8f8" stroke="#999" stroke-width="1.5" stroke-dasharray="4,3" class="wardley-pipeline"/>`
		);

		// Pipeline label (parent name above the box)
		svg.push(
			`<text x="${boxX + boxW / 2}" y="${boxY - 6}" text-anchor="middle" font-size="11" font-weight="bold" fill="#555" class="wardley-pipeline-label">${escapeHtml(parent.name)}</text>`
		);
	}

	// Build set of pipeline sub-component names (rendered inside box, smaller)
	const pipelineSubNames = new Set(
		map.pipelines.flatMap((p) => p.subComponents)
	);
	// Build set of pipeline parent names (label is on the box, skip separate circle label)
	const pipelineParentNames = new Set(
		map.pipelines.map((p) => p.parent)
	);

	// Draw components
	for (const comp of map.components) {
		if (comp.x === undefined || comp.y === undefined) continue;

		// Pipeline parents are represented by their box, skip the circle
		if (pipelineParentNames.has(comp.name)) continue;

		const x = px(comp.x);
		const y = py(comp.y);
		const colors = getStageColors(comp.stage);
		const isPipelineSub = pipelineSubNames.has(comp.name);
		const r = isPipelineSub ? nodeRadius - 2 : nodeRadius;

		const nodeClass = comp.isAnchor
			? "wardley-node wardley-anchor"
			: isPipelineSub
			? `wardley-node wardley-pipeline-component wardley-stage-${comp.stage}`
			: `wardley-node wardley-component wardley-stage-${comp.stage}`;

		svg.push(
			`<circle cx="${x}" cy="${y}" r="${r}" fill="${colors.fill}" stroke="${colors.stroke}" stroke-width="2" class="${nodeClass}"/>`
		);

		// Strategy marker overlay
		if (comp.strategy) {
			svg.push(
				`<text x="${x}" y="${y + r + 14}" text-anchor="middle" font-size="9" fill="#666" class="wardley-strategy">(${comp.strategy})</text>`
			);
		}

		// Inertia indicator (vertical bar right of component)
		if (comp.hasInertia) {
			const ix = x + r + 4;
			svg.push(
				`<line x1="${ix}" y1="${y - r}" x2="${ix}" y2="${y + r}" stroke="#333" stroke-width="4" class="wardley-inertia"/>`
			);
		}

		// Component label (pipeline sub-components get label below to fit inside box)
		if (isPipelineSub) {
			svg.push(
				`<text x="${x}" y="${y + r + 12}" text-anchor="middle" font-size="${fontSize - 2}" fill="#333" class="wardley-label wardley-pipeline-sub-label">${escapeHtml(comp.name)}</text>`
			);
		} else {
			svg.push(
				`<text x="${x}" y="${y - r - 5}" text-anchor="middle" font-size="${fontSize}" font-weight="bold" fill="#000" class="wardley-label">${escapeHtml(comp.name)}</text>`
			);
		}
	}

	// Annotations
	if (map.annotations.length > 0) {
		let annotY = height - 35;
		for (const ann of map.annotations) {
			svg.push(
				`<text x="${padding}" y="${annotY}" font-size="10" fill="#666" class="wardley-annotation">[${ann.id}] ${escapeHtml(ann.text)}</text>`
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
 * Compute edge coordinates that stop at node boundaries instead of centers.
 * Returns [x1, y1, x2, y2] offset inward by radius from each endpoint.
 */
function edgeCoords(
	cx1: number, cy1: number,
	cx2: number, cy2: number,
	radius: number
): [number, number, number, number] {
	const dx = cx2 - cx1;
	const dy = cy2 - cy1;
	const len = Math.sqrt(dx * dx + dy * dy);
	if (len === 0) return [cx1, cy1, cx2, cy2];
	const ux = dx / len;
	const uy = dy / len;
	return [
		cx1 + ux * radius,
		cy1 + uy * radius,
		cx2 - ux * radius,
		cy2 - uy * radius,
	];
}

/**
 * Calculate X and Y positions for all components
 */
function calculatePositions(map: WardleyMap): void {
	// X-axis: Based on evolution stage (initial positioning)
	for (const comp of map.components) {
		comp.x = STAGE_POSITIONS[comp.stage];
	}

	// Y-axis: Longest path from root (anchors/sources at top, deepest deps at bottom)
	const depths = longestPathFromRoot(map.components, map.dependencies);
	const maxDepth = Math.max(...depths.values(), 0);

	for (const comp of map.components) {
		const depth = depths.get(comp.name) ?? 0;
		// depth 0 = top (Y=0), maxDepth = bottom
		comp.y = maxDepth > 0 ? depth / (maxDepth + 1) : 0;
	}

	// Anchors always at the top
	for (const comp of map.components) {
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
			targetComp.y = sourceComp.y;
		}
	}

	// Pipeline sub-components inherit parent's Y, keep their own X (from stage)
	for (const pipeline of map.pipelines) {
		const parent = map.components.find((c) => c.name === pipeline.parent);
		if (parent && parent.y !== undefined) {
			for (const subName of pipeline.subComponents) {
				const sub = map.components.find((c) => c.name === subName);
				if (sub) {
					sub.y = parent.y;
				}
			}
		}
	}

	// Spread components that share the same Y level within their band
	// Exclude pipeline sub-components from spreading (they keep their stage X)
	const pipelineSubNames = new Set(
		map.pipelines.flatMap((p) => p.subComponents)
	);
	const spreadable = map.components.filter((c) => !pipelineSubNames.has(c.name));
	spreadOverlappingComponents(spreadable, map.dependencies);
}

/**
 * Spread components horizontally within their evolution stage if they overlap.
 * Orders components by average neighbor X to reduce edge crossings.
 */
function spreadOverlappingComponents(components: Component[], dependencies: Dependency[]): void {
	// Build neighbor lookup for connection-aware ordering
	const neighbors = new Map<string, string[]>();
	for (const comp of components) {
		neighbors.set(comp.name, []);
	}
	for (const dep of dependencies) {
		neighbors.get(dep.from)?.push(dep.to);
		neighbors.get(dep.to)?.push(dep.from);
	}

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
	for (const [, group] of groups) {
		if (group.length > 1) {
			const baseX = group[0].x!;

			// Sort by average X of connected neighbors to reduce edge crossings
			const compByName = new Map(components.map(c => [c.name, c]));
			group.sort((a, b) => {
				const avgA = averageNeighborX(a.name, neighbors, compByName);
				const avgB = averageNeighborX(b.name, neighbors, compByName);
				return avgA - avgB;
			});

			// Adaptive spread based on group size
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
 * Compute the average X position of a component's connected neighbors.
 * Returns the component's own X if it has no neighbors with positions.
 */
function averageNeighborX(
	name: string,
	neighbors: Map<string, string[]>,
	compByName: Map<string, Component>
): number {
	const neighNames = neighbors.get(name) ?? [];
	let sum = 0;
	let count = 0;
	for (const n of neighNames) {
		const nc = compByName.get(n);
		if (nc && nc.x !== undefined) {
			sum += nc.x;
			count++;
		}
	}
	if (count === 0) {
		return compByName.get(name)?.x ?? 0.5;
	}
	return sum / count;
}

/**
 * Compute depth of each component via longest path from root nodes.
 * Root nodes are anchors or components with no incoming dependencies.
 * "A -> B" means A depends on B, so B is deeper (higher depth number).
 *
 * Returns a map of component name to depth (0 = top of value chain).
 */
function longestPathFromRoot(
	components: Component[],
	dependencies: Dependency[]
): Map<string, number> {
	const depths = new Map<string, number>();
	// Forward graph: A -> B means edge from A to B (A is parent, B is child/deeper)
	const children = new Map<string, string[]>();
	// Track which nodes have incoming edges (are depended upon)
	const hasParent = new Set<string>();

	for (const comp of components) {
		children.set(comp.name, []);
	}

	for (const dep of dependencies) {
		// A -> B: A depends on B, so B is deeper. Edge: A -> B
		children.get(dep.from)?.push(dep.to);
		hasParent.add(dep.to);
	}

	// Root nodes: anchors first, then any node with no parent
	const roots: string[] = [];
	for (const comp of components) {
		if (comp.isAnchor || !hasParent.has(comp.name)) {
			roots.push(comp.name);
			depths.set(comp.name, 0);
		}
	}

	// BFS from roots, tracking longest path
	const queue = [...roots];
	while (queue.length > 0) {
		const current = queue.shift()!;
		const currentDepth = depths.get(current) ?? 0;

		for (const child of children.get(current) ?? []) {
			const prevDepth = depths.get(child) ?? -1;
			const newDepth = currentDepth + 1;
			if (newDepth > prevDepth) {
				depths.set(child, newDepth);
				queue.push(child);
			}
		}
	}

	// Handle disconnected components (no edges at all): assign depth by stage
	const stageDepths: Record<string, number> = {
		genesis: 1,
		custom: 2,
		product: 3,
		commodity: 4,
	};
	const maxDepth = Math.max(...depths.values(), 0);
	for (const comp of components) {
		if (!depths.has(comp.name)) {
			// Scale stage-based depth relative to the graph's actual depth
			const ratio = maxDepth > 0 ? stageDepths[comp.stage] / 5 : stageDepths[comp.stage] / 5;
			depths.set(comp.name, Math.round(ratio * (maxDepth || 4)));
		}
	}

	return depths;
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
