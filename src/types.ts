/**
 * Evolution stages for Wardley Map components
 */
export type EvolutionStage = "genesis" | "custom" | "product" | "commodity";

/**
 * Source strategy for a component
 */
export type SourceStrategy = "build" | "buy" | "outsource" | "market";

/**
 * Flow direction for flow arrows
 */
export type FlowDirection = "forward" | "backward" | "bidirectional";

/**
 * A component in the Wardley Map
 */
export interface Component {
	name: string;
	stage: EvolutionStage;
	isAnchor: boolean;
	strategy?: SourceStrategy;
	hasInertia?: boolean;
	// Computed positions (0-1 range)
	x?: number;
	y?: number;
}

/**
 * A dependency relationship between components
 */
export interface Dependency {
	from: string;
	to: string;
	label?: string;
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
 * Evolve a component to a new stage (without a target component)
 */
export interface EvolveTo {
	component: string;
	targetStage: EvolutionStage;
}

/**
 * A flow relationship (distinct from dependency)
 */
export interface Flow {
	from: string;
	to: string;
	direction: FlowDirection;
	label?: string;
}

/**
 * A pipeline: a parent component with sub-components showing evolution range
 */
export interface Pipeline {
	parent: string; // parent component name
	subComponents: string[]; // names of sub-components (also in components[])
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
	evolveTos: EvolveTo[];
	flows: Flow[];
	pipelines: Pipeline[];
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
