/**
 * Evolution stages for Wardley Map components
 */
export type EvolutionStage = "genesis" | "custom" | "product" | "commodity";

/**
 * A component in the Wardley Map
 */
export interface Component {
	name: string;
	stage: EvolutionStage;
	isAnchor: boolean;
	// Computed positions (0-1 range)
	x?: number;
	y?: number;
}

/**
 * A dependency relationship between components
 */
export interface Dependency {
	from: string; // component name
	to: string; // component name
	label?: string; // optional annotation
}

/**
 * An evolution relationship showing component progression
 */
export interface Evolution {
	from: string; // source component name
	to: string; // target component name
	stage: EvolutionStage; // target evolution stage
}

/**
 * An annotation for the map
 */
export interface Annotation {
	id: string;
	text: string;
}

/**
 * Parsed Wardley Map structure
 */
export interface WardleyMap {
	title?: string;
	components: Component[];
	dependencies: Dependency[];
	evolutions: Evolution[];
	annotations: Annotation[];
	notes: string[];
}

/**
 * Error during parsing
 */
export interface ParseError {
	line: number;
	message: string;
}
