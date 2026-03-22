import type {
	WardleyMap,
	Component,
	Dependency,
	Evolution,
	EvolveTo,
	Flow,
	Pipeline,
	Annotation,
	EvolutionStage,
	SourceStrategy,
	FlowDirection,
	ParseError,
} from "./types";

const VALID_STAGES = ["genesis", "custom", "product", "commodity"];
const VALID_STRATEGIES = ["build", "buy", "outsource", "market"];

/**
 * Parse a Wardley Map from the inline syntax
 */
export function parseWardleyMap(source: string): {
	map: WardleyMap | null;
	errors: ParseError[];
} {
	const lines = source.split("\n");
	const errors: ParseError[] = [];
	const map: WardleyMap = {
		components: [],
		dependencies: [],
		evolutions: [],
		evolveTos: [],
		flows: [],
		pipelines: [],
		annotations: [],
		notes: [],
	};

	const componentMap = new Map<string, Component>();
	let currentPipeline: Pipeline | null = null;

	for (let i = 0; i < lines.length; i++) {
		const rawLine = lines[i];
		const line = rawLine.trim();
		const lineNum = i + 1;
		const isIndented = rawLine.length > 0 && (rawLine.startsWith("\t") || rawLine.startsWith("  "));

		// Empty lines and comments end any active pipeline block
		if (!line || line.startsWith("#")) {
			if (currentPipeline) currentPipeline = null;
			continue;
		}

		// If we're inside a pipeline block, try to parse indented components
		if (currentPipeline) {
			if (isIndented) {
				const pipeCompMatch = line.match(
					/^component\s+(.+?)\s+\[(\w+)\]$/
				);
				if (pipeCompMatch) {
					const name = pipeCompMatch[1].trim();
					const stage = pipeCompMatch[2] as EvolutionStage;

					if (!isValidStage(stage)) {
						errors.push({
							line: lineNum,
							message: `Invalid evolution stage '${stage}' in pipeline component`,
						});
						continue;
					}

					if (componentMap.has(name)) {
						errors.push({
							line: lineNum,
							message: `Component '${name}' declared multiple times`,
						});
						continue;
					}

					const component: Component = { name, stage, isAnchor: false };
					componentMap.set(name, component);
					map.components.push(component);
					currentPipeline.subComponents.push(name);
					continue;
				}
			}
			// Any non-matching line (indented or not) ends the pipeline block
			// and falls through to normal parsing below
			currentPipeline = null;
		}

		try {
			// Title
			if (line.startsWith("title ")) {
				map.title = line.substring(6).trim();
				continue;
			}

			// Component (with optional strategy)
			// component Name [stage]
			// component Name [stage] (build)
			const componentMatch = line.match(
				/^component\s+(.+?)\s+\[(\w+)\](?:\s+\((\w+)\))?$/
			);
			if (componentMatch) {
				const name = componentMatch[1].trim();
				const stage = componentMatch[2] as EvolutionStage;
				const strategy = componentMatch[3] as SourceStrategy | undefined;

				if (!isValidStage(stage)) {
					errors.push({
						line: lineNum,
						message: `Invalid evolution stage '${stage}'. Must be: genesis, custom, product, commodity`,
					});
					continue;
				}

				if (strategy && !isValidStrategy(strategy)) {
					errors.push({
						line: lineNum,
						message: `Invalid strategy '${strategy}'. Must be: build, buy, outsource, market`,
					});
					continue;
				}

				if (componentMap.has(name)) {
					errors.push({
						line: lineNum,
						message: `Component '${name}' declared multiple times`,
					});
					continue;
				}

				const component: Component = { name, stage, isAnchor: false, strategy };
				componentMap.set(name, component);
				map.components.push(component);
				continue;
			}

			// Anchor (with optional strategy)
			const anchorMatch = line.match(
				/^anchor\s+(.+?)\s+\[(\w+)\](?:\s+\((\w+)\))?$/
			);
			if (anchorMatch) {
				const name = anchorMatch[1].trim();
				const stage = anchorMatch[2] as EvolutionStage;
				const strategy = anchorMatch[3] as SourceStrategy | undefined;

				if (!isValidStage(stage)) {
					errors.push({
						line: lineNum,
						message: `Invalid evolution stage '${stage}'. Must be: genesis, custom, product, commodity`,
					});
					continue;
				}

				if (strategy && !isValidStrategy(strategy)) {
					errors.push({
						line: lineNum,
						message: `Invalid strategy '${strategy}'. Must be: build, buy, outsource, market`,
					});
					continue;
				}

				if (componentMap.has(name)) {
					errors.push({
						line: lineNum,
						message: `Component '${name}' declared multiple times`,
					});
					continue;
				}

				const component: Component = { name, stage, isAnchor: true, strategy };
				componentMap.set(name, component);
				map.components.push(component);
				continue;
			}

			// Inertia
			const inertiaMatch = line.match(/^inertia\s+(.+)$/);
			if (inertiaMatch) {
				const name = inertiaMatch[1].trim();
				const comp = componentMap.get(name);
				if (!comp) {
					errors.push({
						line: lineNum,
						message: `Component '${name}' not declared`,
					});
					continue;
				}
				comp.hasInertia = true;
				continue;
			}

			// Evolution (component to component)
			const evolveMatch = line.match(
				/^evolve\s+(.+?)\s+->\s+(.+?)\s+\[(\w+)\]$/
			);
			if (evolveMatch) {
				const from = evolveMatch[1].trim();
				const to = evolveMatch[2].trim();
				const stage = evolveMatch[3] as EvolutionStage;

				if (!componentMap.has(from)) {
					errors.push({
						line: lineNum,
						message: `Component '${from}' not declared`,
					});
					continue;
				}

				if (!componentMap.has(to)) {
					errors.push({
						line: lineNum,
						message: `Component '${to}' not declared`,
					});
					continue;
				}

				map.evolutions.push({ from, to, stage });
				continue;
			}

			// Evolve to stage (no target component)
			const evolveStageMatch = line.match(
				/^evolve\s+(.+?)\s+\[(\w+)\]$/
			);
			if (evolveStageMatch) {
				const name = evolveStageMatch[1].trim();
				const stage = evolveStageMatch[2] as EvolutionStage;

				if (!componentMap.has(name)) {
					errors.push({
						line: lineNum,
						message: `Component '${name}' not declared`,
					});
					continue;
				}

				if (!isValidStage(stage)) {
					errors.push({
						line: lineNum,
						message: `Invalid evolution stage '${stage}'`,
					});
					continue;
				}

				map.evolveTos.push({ component: name, targetStage: stage });
				continue;
			}

			// Flow arrows: A +> B, A +< B, A +<> B (with optional label via ;)
			const flowMatch = line.match(
				/^(.+?)\s+\+(<?)(>?)\s+(.+?)(?:;\s*(.+))?$/
			);
			if (flowMatch && (flowMatch[2] || flowMatch[3])) {
				const from = flowMatch[1].trim();
				const hasLeft = flowMatch[2] === "<";
				const hasRight = flowMatch[3] === ">";
				const to = flowMatch[4].trim();
				const label = flowMatch[5]?.trim();

				let direction: FlowDirection;
				if (hasLeft && hasRight) {
					direction = "bidirectional";
				} else if (hasLeft) {
					direction = "backward";
				} else {
					direction = "forward";
				}

				map.flows.push({ from, to, direction, label });
				continue;
			}

			// Dependencies (chain notation: A -> B -> C)
			if (line.includes("->")) {
				parseDependencyChain(
					line,
					lineNum,
					componentMap,
					map.dependencies,
					errors
				);
				continue;
			}

			// Annotation
			const annotationMatch = line.match(/^annotation\s+(\S+)\s+(.+)$/);
			if (annotationMatch) {
				const id = annotationMatch[1];
				const text = annotationMatch[2];
				map.annotations.push({ id, text });
				continue;
			}

			// Note
			if (line.startsWith("note ")) {
				map.notes.push(line.substring(5).trim());
				continue;
			}

			// Pipeline block start
			const pipelineMatch = line.match(/^pipeline\s+(.+)$/);
			if (pipelineMatch) {
				const parentName = pipelineMatch[1].trim();
				if (!componentMap.has(parentName)) {
					errors.push({
						line: lineNum,
						message: `Pipeline parent '${parentName}' not declared as a component`,
					});
					continue;
				}
				currentPipeline = { parent: parentName, subComponents: [] };
				map.pipelines.push(currentPipeline);
				continue;
			}

			// Unknown syntax
			if (line) {
				errors.push({
					line: lineNum,
					message: `Unknown syntax: ${line}`,
				});
			}
		} catch (e) {
			errors.push({
				line: lineNum,
				message: `Error parsing line: ${e}`,
			});
		}
	}

	// Validate dependencies
	for (const dep of map.dependencies) {
		if (!componentMap.has(dep.from)) {
			errors.push({
				line: 0,
				message: `Component '${dep.from}' referenced but not declared`,
			});
		}
		if (!componentMap.has(dep.to)) {
			errors.push({
				line: 0,
				message: `Component '${dep.to}' referenced but not declared`,
			});
		}
	}

	// Validate flows
	for (const flow of map.flows) {
		if (!componentMap.has(flow.from)) {
			errors.push({
				line: 0,
				message: `Flow references undeclared component '${flow.from}'`,
			});
		}
		if (!componentMap.has(flow.to)) {
			errors.push({
				line: 0,
				message: `Flow references undeclared component '${flow.to}'`,
			});
		}
	}

	return {
		map: errors.length === 0 ? map : null,
		errors,
	};
}

/**
 * Parse a dependency chain like "A -> B -> C" or "A -> B; label"
 */
function parseDependencyChain(
	line: string,
	lineNum: number,
	componentMap: Map<string, Component>,
	dependencies: Dependency[],
	errors: ParseError[]
): void {
	const parts = line.split("->");

	for (let i = 0; i < parts.length - 1; i++) {
		let from = parts[i].trim();
		let to = parts[i + 1].trim();
		let label: string | undefined;

		// Check for semicolon annotation on the "to" part
		const semicolonIdx = to.indexOf(";");
		if (semicolonIdx !== -1) {
			label = to.substring(semicolonIdx + 1).trim();
			to = to.substring(0, semicolonIdx).trim();
		}

		// Check for semicolon annotation on the "from" part (for first item)
		if (i === 0) {
			const fromSemicolonIdx = from.indexOf(";");
			if (fromSemicolonIdx !== -1) {
				from = from.substring(0, fromSemicolonIdx).trim();
			}
		}

		dependencies.push({ from, to, label });
	}
}

function isValidStage(stage: string): stage is EvolutionStage {
	return VALID_STAGES.includes(stage);
}

function isValidStrategy(strategy: string): strategy is SourceStrategy {
	return VALID_STRATEGIES.includes(strategy);
}
