import type {
	WardleyMap,
	Component,
	Dependency,
	Evolution,
	Annotation,
	EvolutionStage,
	ParseError,
} from "./types";

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
		annotations: [],
		notes: [],
	};

	const componentMap = new Map<string, Component>();

	for (let i = 0; i < lines.length; i++) {
		const line = lines[i].trim();
		const lineNum = i + 1;

		// Skip empty lines and comments
		if (!line || line.startsWith("#")) continue;

		try {
			// Title
			if (line.startsWith("title ")) {
				map.title = line.substring(6).trim();
				continue;
			}

			// Component
			const componentMatch = line.match(
				/^component\s+(.+?)\s+\[(\w+)\]$/
			);
			if (componentMatch) {
				const name = componentMatch[1].trim();
				const stage = componentMatch[2] as EvolutionStage;

				if (!isValidStage(stage)) {
					errors.push({
						line: lineNum,
						message: `Invalid evolution stage '${stage}'. Must be: genesis, custom, product, commodity`,
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
				continue;
			}

			// Anchor
			const anchorMatch = line.match(/^anchor\s+(.+?)\s+\[(\w+)\]$/);
			if (anchorMatch) {
				const name = anchorMatch[1].trim();
				const stage = anchorMatch[2] as EvolutionStage;

				if (!isValidStage(stage)) {
					errors.push({
						line: lineNum,
						message: `Invalid evolution stage '${stage}'. Must be: genesis, custom, product, commodity`,
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

				const component: Component = { name, stage, isAnchor: true };
				componentMap.set(name, component);
				map.components.push(component);
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

			// Evolution (stage evolution)
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

				// For stage evolution, we can show it differently
				// For now, we'll just skip or handle it later
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
	// Split by -> but handle semicolon annotations
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

/**
 * Check if a stage is valid
 */
function isValidStage(stage: string): stage is EvolutionStage {
	return ["genesis", "custom", "product", "commodity"].includes(stage);
}
