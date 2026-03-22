import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { parseWardleyMap } from "./src/parser.ts";
import { renderWardleyMap } from "./src/renderer.ts";
import type { WardleyMap, Component } from "./src/types.ts";

// ============================================================
// Parser Tests
// ============================================================

describe("Parser", () => {
	describe("basic syntax", () => {
		it("parses title", () => {
			const { map } = parseWardleyMap("title My Map");
			assert.equal(map!.title, "My Map");
		});

		it("parses components with stage", () => {
			const { map } = parseWardleyMap("component Foo [genesis]");
			assert.equal(map!.components.length, 1);
			assert.equal(map!.components[0].name, "Foo");
			assert.equal(map!.components[0].stage, "genesis");
			assert.equal(map!.components[0].isAnchor, false);
		});

		it("parses anchors", () => {
			const { map } = parseWardleyMap("anchor User [product]");
			assert.equal(map!.components[0].isAnchor, true);
			assert.equal(map!.components[0].stage, "product");
		});

		it("parses multi-word component names", () => {
			const { map } = parseWardleyMap("component Cup of Tea [product]");
			assert.equal(map!.components[0].name, "Cup of Tea");
		});

		it("parses dependencies", () => {
			const src = `component A [genesis]\ncomponent B [custom]\nA -> B`;
			const { map } = parseWardleyMap(src);
			assert.equal(map!.dependencies.length, 1);
			assert.equal(map!.dependencies[0].from, "A");
			assert.equal(map!.dependencies[0].to, "B");
		});

		it("parses dependency chains", () => {
			const src = `component A [genesis]\ncomponent B [custom]\ncomponent C [product]\nA -> B -> C`;
			const { map } = parseWardleyMap(src);
			assert.equal(map!.dependencies.length, 2);
			assert.equal(map!.dependencies[0].from, "A");
			assert.equal(map!.dependencies[0].to, "B");
			assert.equal(map!.dependencies[1].from, "B");
			assert.equal(map!.dependencies[1].to, "C");
		});

		it("parses dependency labels", () => {
			const src = `component A [genesis]\ncomponent B [custom]\nA -> B; some label`;
			const { map } = parseWardleyMap(src);
			assert.equal(map!.dependencies[0].label, "some label");
		});

		it("parses annotations", () => {
			const { map } = parseWardleyMap("annotation 1 Some insight");
			assert.equal(map!.annotations[0].id, "1");
			assert.equal(map!.annotations[0].text, "Some insight");
		});

		it("parses notes", () => {
			const { map } = parseWardleyMap("note This is a note");
			assert.equal(map!.notes[0], "This is a note");
		});

		it("skips comments and empty lines", () => {
			const src = `# comment\n\ncomponent A [genesis]`;
			const { map } = parseWardleyMap(src);
			assert.equal(map!.components.length, 1);
		});
	});

	describe("evolution", () => {
		it("parses component-to-component evolution", () => {
			const src = `component A [genesis]\ncomponent B [product]\nevolve A -> B [product]`;
			const { map } = parseWardleyMap(src);
			assert.equal(map!.evolutions.length, 1);
			assert.equal(map!.evolutions[0].from, "A");
			assert.equal(map!.evolutions[0].to, "B");
		});

		it("parses evolve-to-stage", () => {
			const src = `component A [genesis]\nevolve A [product]`;
			const { map } = parseWardleyMap(src);
			assert.equal(map!.evolveTos.length, 1);
			assert.equal(map!.evolveTos[0].component, "A");
			assert.equal(map!.evolveTos[0].targetStage, "product");
		});
	});

	describe("strategy markers", () => {
		it("parses strategy on component", () => {
			const { map } = parseWardleyMap("component Foo [product] (build)");
			assert.equal(map!.components[0].strategy, "build");
		});

		it("parses all strategy types", () => {
			for (const s of ["build", "buy", "outsource", "market"]) {
				const { map } = parseWardleyMap(`component X [genesis] (${s})`);
				assert.equal(map!.components[0].strategy, s);
			}
		});

		it("parses strategy on anchor", () => {
			const { map } = parseWardleyMap("anchor User [product] (buy)");
			assert.equal(map!.components[0].strategy, "buy");
		});

		it("component without strategy has undefined strategy", () => {
			const { map } = parseWardleyMap("component Foo [product]");
			assert.equal(map!.components[0].strategy, undefined);
		});
	});

	describe("inertia", () => {
		it("sets hasInertia on component", () => {
			const src = `component Foo [custom]\ninertia Foo`;
			const { map } = parseWardleyMap(src);
			assert.equal(map!.components[0].hasInertia, true);
		});

		it("errors on undeclared component", () => {
			const { errors } = parseWardleyMap("inertia Unknown");
			assert.equal(errors.length, 1);
			assert.ok(errors[0].message.includes("not declared"));
		});
	});

	describe("flow arrows", () => {
		it("parses forward flow", () => {
			const src = `component A [genesis]\ncomponent B [product]\nA +> B`;
			const { map } = parseWardleyMap(src);
			assert.equal(map!.flows.length, 1);
			assert.equal(map!.flows[0].direction, "forward");
			assert.equal(map!.flows[0].from, "A");
			assert.equal(map!.flows[0].to, "B");
		});

		it("parses backward flow", () => {
			const src = `component A [genesis]\ncomponent B [product]\nA +< B`;
			const { map } = parseWardleyMap(src);
			assert.equal(map!.flows[0].direction, "backward");
		});

		it("parses bidirectional flow", () => {
			const src = `component A [genesis]\ncomponent B [product]\nA +<> B`;
			const { map } = parseWardleyMap(src);
			assert.equal(map!.flows[0].direction, "bidirectional");
		});

		it("parses flow with label", () => {
			const src = `component A [genesis]\ncomponent B [product]\nA +> B; data flow`;
			const { map } = parseWardleyMap(src);
			assert.equal(map!.flows[0].label, "data flow");
		});
	});

	describe("pipeline", () => {
		it("parses pipeline with sub-components", () => {
			const src = [
				"component DB [product]",
				"pipeline DB",
				"  component SQL [custom]",
				"  component NoSQL [product]",
			].join("\n");
			const { map, errors } = parseWardleyMap(src);
			assert.equal(errors.length, 0);
			assert.equal(map!.pipelines.length, 1);
			assert.equal(map!.pipelines[0].parent, "DB");
			assert.deepEqual(map!.pipelines[0].subComponents, ["SQL", "NoSQL"]);
			// Sub-components also appear in the global components list
			assert.equal(map!.components.length, 3); // DB + SQL + NoSQL
		});

		it("errors on undeclared pipeline parent", () => {
			const src = "pipeline Unknown\n  component X [genesis]";
			const { errors } = parseWardleyMap(src);
			assert.ok(errors.some((e) => e.message.includes("not declared")));
		});

		it("ends pipeline block on non-indented line", () => {
			const src = [
				"component DB [product]",
				"pipeline DB",
				"  component SQL [custom]",
				"component Other [genesis]",
			].join("\n");
			const { map } = parseWardleyMap(src);
			assert.equal(map!.pipelines[0].subComponents.length, 1);
			assert.equal(map!.components.find((c) => c.name === "Other")?.stage, "genesis");
		});

		it("ends pipeline block on empty line", () => {
			const src = [
				"component DB [product]",
				"component Svc [custom]",
				"pipeline DB",
				"  component SQL [custom]",
				"  component NoSQL [product]",
				"",
				"Svc -> DB",
			].join("\n");
			const { map, errors } = parseWardleyMap(src);
			assert.equal(errors.length, 0);
			assert.equal(map!.pipelines[0].subComponents.length, 2);
			assert.equal(map!.dependencies.length, 1);
		});

		it("handles indented non-component lines after pipeline gracefully", () => {
			// Simulates copy-paste where dependency lines get indentation
			const src = [
				"component DB [product]",
				"component Svc [custom]",
				"pipeline DB",
				"  component SQL [custom]",
				"  Svc -> DB",
			].join("\n");
			const { map, errors } = parseWardleyMap(src);
			// The indented dependency line should close the pipeline and parse as a dependency
			assert.equal(errors.length, 0);
			assert.equal(map!.pipelines[0].subComponents.length, 1);
			assert.equal(map!.dependencies.length, 1);
		});
	});

	describe("error handling", () => {
		it("rejects invalid evolution stage", () => {
			const { errors } = parseWardleyMap("component Foo [invalid]");
			assert.equal(errors.length, 1);
			assert.ok(errors[0].message.includes("Invalid evolution stage"));
		});

		it("rejects duplicate component names", () => {
			const src = "component Foo [genesis]\ncomponent Foo [product]";
			const { errors } = parseWardleyMap(src);
			assert.ok(errors.some((e) => e.message.includes("multiple times")));
		});

		it("rejects invalid strategy", () => {
			const { errors } = parseWardleyMap("component Foo [genesis] (steal)");
			assert.ok(errors.some((e) => e.message.includes("Invalid strategy")));
		});

		it("rejects undeclared dependency components", () => {
			const src = "component A [genesis]\nA -> Missing";
			const { errors } = parseWardleyMap(src);
			assert.ok(errors.some((e) => e.message.includes("not declared")));
		});

		it("reports unknown syntax with line number", () => {
			const { errors } = parseWardleyMap("gibberish here");
			assert.equal(errors.length, 1);
			assert.equal(errors[0].line, 1);
			assert.ok(errors[0].message.includes("Unknown syntax"));
		});

		it("returns null map on errors", () => {
			const { map } = parseWardleyMap("component Foo [invalid]");
			assert.equal(map, null);
		});
	});
});

// ============================================================
// Layout Tests
// ============================================================

describe("Layout", () => {
	function getPositions(src: string): Map<string, { x: number; y: number }> {
		const { map } = parseWardleyMap(src);
		// renderWardleyMap triggers calculatePositions as a side effect
		renderWardleyMap(map!);
		const pos = new Map<string, { x: number; y: number }>();
		for (const c of map!.components) {
			pos.set(c.name, { x: c.x!, y: c.y! });
		}
		return pos;
	}

	it("anchors are at Y=0 (top)", () => {
		const pos = getPositions("anchor User [product]");
		assert.equal(pos.get("User")!.y, 0);
	});

	it("deeper dependencies get higher Y values (further from top)", () => {
		const src = [
			"anchor A [genesis]",
			"component B [custom]",
			"component C [product]",
			"component D [commodity]",
			"A -> B",
			"B -> C",
			"C -> D",
		].join("\n");
		const pos = getPositions(src);
		assert.ok(pos.get("A")!.y < pos.get("B")!.y, "A should be above B");
		assert.ok(pos.get("B")!.y < pos.get("C")!.y, "B should be above C");
		assert.ok(pos.get("C")!.y < pos.get("D")!.y, "C should be above D");
	});

	it("siblings at same depth share Y", () => {
		const src = [
			"anchor Root [genesis]",
			"component Left [custom]",
			"component Right [product]",
			"Root -> Left",
			"Root -> Right",
		].join("\n");
		const pos = getPositions(src);
		assert.equal(pos.get("Left")!.y, pos.get("Right")!.y);
	});

	it("evolved component inherits source Y", () => {
		const src = [
			"component A [custom]",
			"component B [product]",
			"evolve A -> B [product]",
		].join("\n");
		const pos = getPositions(src);
		assert.equal(pos.get("A")!.y, pos.get("B")!.y);
	});

	it("Cup and Power are at different depths in Tea Shop", () => {
		const src = [
			"anchor Business [custom]",
			"component Cup of Tea [product]",
			"component Cup [commodity]",
			"component Hot Water [commodity]",
			"component Kettle [custom]",
			"component Power [commodity]",
			"Business -> Cup of Tea",
			"Cup of Tea -> Cup",
			"Cup of Tea -> Hot Water",
			"Hot Water -> Kettle",
			"Kettle -> Power",
		].join("\n");
		const pos = getPositions(src);
		// Cup is depth 2, Power is depth 4. Cup should be above Power.
		assert.ok(
			pos.get("Cup")!.y < pos.get("Power")!.y,
			`Cup (y=${pos.get("Cup")!.y}) should be above Power (y=${pos.get("Power")!.y})`
		);
		// Cup and Hot Water are at the same depth (both direct children of Cup of Tea)
		assert.equal(pos.get("Cup")!.y, pos.get("Hot Water")!.y);
	});

	it("pipeline sub-components inherit parent Y", () => {
		const src = [
			"anchor Root [genesis]",
			"component DB [product]",
			"Root -> DB",
			"pipeline DB",
			"  component SQL [custom]",
			"  component Cloud [commodity]",
		].join("\n");
		const pos = getPositions(src);
		assert.equal(pos.get("SQL")!.y, pos.get("DB")!.y);
		assert.equal(pos.get("Cloud")!.y, pos.get("DB")!.y);
	});

	it("pipeline sub-components keep their stage X", () => {
		const src = [
			"component DB [product]",
			"pipeline DB",
			"  component SQL [custom]",
			"  component Cloud [commodity]",
		].join("\n");
		const pos = getPositions(src);
		// custom band center = 0.375, commodity = 0.875
		assert.equal(pos.get("SQL")!.x, 0.375);
		assert.equal(pos.get("Cloud")!.x, 0.875);
	});

	it("X position comes from evolution stage band", () => {
		const pos = getPositions("component A [genesis]");
		assert.equal(pos.get("A")!.x, 0.125); // genesis band center
	});
});

// ============================================================
// Renderer Tests
// ============================================================

describe("Renderer", () => {
	function render(src: string): string {
		const { map } = parseWardleyMap(src);
		return renderWardleyMap(map!);
	}

	it("produces valid SVG with xmlns and viewBox", () => {
		const svg = render("component A [genesis]");
		assert.ok(svg.includes('xmlns="http://www.w3.org/2000/svg"'));
		assert.ok(svg.includes('viewBox="0 0 800 600"'));
		assert.ok(svg.startsWith("<svg"));
		assert.ok(svg.endsWith("</svg>"));
	});

	it("renders correct number of circles", () => {
		const svg = render(
			"component A [genesis]\ncomponent B [custom]\ncomponent C [product]"
		);
		const circles = svg.match(/<circle/g) || [];
		assert.equal(circles.length, 3);
	});

	it("renders dependency arrows", () => {
		const src = "component A [genesis]\ncomponent B [custom]\nA -> B";
		const svg = render(src);
		assert.ok(svg.includes("wardley-dependency"));
		assert.ok(svg.includes('marker-end="url(#arrowhead)"'));
	});

	it("renders evolution arrows as dashed", () => {
		const src =
			"component A [custom]\ncomponent B [product]\nevolve A -> B [product]";
		const svg = render(src);
		assert.ok(svg.includes("wardley-evolution"));
		assert.ok(svg.includes("stroke-dasharray"));
	});

	it("renders title", () => {
		const svg = render("title Hello World");
		assert.ok(svg.includes("Hello World"));
		assert.ok(svg.includes("wardley-title"));
	});

	it("renders stage labels", () => {
		const svg = render("component A [genesis]");
		assert.ok(svg.includes("Genesis"));
		assert.ok(svg.includes("Custom Built"));
		assert.ok(svg.includes("Product"));
		assert.ok(svg.includes("Commodity"));
	});

	it("renders axis labels", () => {
		const svg = render("component A [genesis]");
		assert.ok(svg.includes("Evolution"));
		assert.ok(svg.includes("Value Chain"));
	});

	it("renders CSS classes on all element types", () => {
		const src = [
			"title Test",
			"component A [genesis]",
			"component B [custom]",
			"A -> B",
			"annotation 1 Note",
		].join("\n");
		const svg = render(src);
		assert.ok(svg.includes("wardley-node"));
		assert.ok(svg.includes("wardley-edge"));
		assert.ok(svg.includes("wardley-grid"));
		assert.ok(svg.includes("wardley-label"));
		assert.ok(svg.includes("wardley-title"));
		assert.ok(svg.includes("wardley-stage-label"));
		assert.ok(svg.includes("wardley-axis-label"));
		assert.ok(svg.includes("wardley-annotation"));
		assert.ok(svg.includes("wardley-background"));
	});

	it("renders inertia indicator", () => {
		const src = "component A [custom]\ninertia A";
		const svg = render(src);
		assert.ok(svg.includes("wardley-inertia"));
	});

	it("renders strategy marker", () => {
		const svg = render("component A [product] (build)");
		assert.ok(svg.includes("wardley-strategy"));
		assert.ok(svg.includes("(build)"));
	});

	it("renders flow arrows", () => {
		const src = "component A [genesis]\ncomponent B [product]\nA +> B; data";
		const svg = render(src);
		assert.ok(svg.includes("wardley-flow"));
		assert.ok(svg.includes("arrowhead-flow"));
		assert.ok(svg.includes("data"));
	});

	it("renders bidirectional flow with two markers", () => {
		const src = "component A [genesis]\ncomponent B [product]\nA +<> B";
		const svg = render(src);
		assert.ok(svg.includes("arrowhead-flow-start"));
		assert.ok(svg.includes("arrowhead-flow"));
	});

	it("renders evolve-to arrow", () => {
		const src = "component A [genesis]\nevolve A [product]";
		const svg = render(src);
		assert.ok(svg.includes("wardley-evolve-to"));
		assert.ok(svg.includes("wardley-evolve-target"));
	});

	it("renders pipeline box", () => {
		const src = [
			"component DB [product]",
			"pipeline DB",
			"  component SQL [custom]",
			"  component NoSQL [product]",
		].join("\n");
		const svg = render(src);
		assert.ok(svg.includes("wardley-pipeline"));
		assert.ok(svg.includes("wardley-pipeline-label"));
		assert.ok(svg.includes("DB")); // pipeline label
		assert.ok(svg.includes("wardley-pipeline-component"));
	});

	it("pipeline parent has no circle", () => {
		const src = [
			"component DB [product]",
			"pipeline DB",
			"  component SQL [custom]",
		].join("\n");
		const svg = render(src);
		// DB should not have a circle (it's the pipeline box)
		// SQL should have a circle
		const circles = (svg.match(/class="wardley-node[^"]*"/g) || []);
		assert.ok(!circles.some((c) => c.includes("wardley-component") && !c.includes("pipeline")),
			"Pipeline parent should not render as a regular component circle");
	});

	it("escapes HTML in component names", () => {
		const svg = render('component A <script> [genesis]');
		assert.ok(svg.includes("&lt;script&gt;"));
		assert.ok(!svg.includes("<script>"));
	});

	it("renders annotations", () => {
		const src = "annotation 1 Important insight";
		const svg = render(src);
		assert.ok(svg.includes("[1] Important insight"));
		assert.ok(svg.includes("wardley-annotation"));
	});
});

// ============================================================
// Backward Compatibility: Tea Shop
// ============================================================

describe("Tea Shop backward compatibility", () => {
	const TEA_SHOP = [
		"title Tea Shop",
		"",
		"anchor Business [custom]",
		"anchor Public [commodity]",
		"",
		"component Cup of Tea [product]",
		"component Cup [commodity]",
		"component Tea [commodity]",
		"component Hot Water [commodity]",
		"component Water [commodity]",
		"component Kettle [custom]",
		"component Electric Kettle [product]",
		"component Power [commodity]",
		"",
		"Business -> Cup of Tea",
		"Public -> Cup of Tea",
		"Cup of Tea -> Cup",
		"Cup of Tea -> Tea",
		"Cup of Tea -> Hot Water",
		"Hot Water -> Water",
		"Hot Water -> Kettle",
		"Kettle -> Power",
		"",
		"evolve Kettle -> Electric Kettle [product]",
	].join("\n");

	it("parses without errors", () => {
		const { map, errors } = parseWardleyMap(TEA_SHOP);
		assert.equal(errors.length, 0);
		assert.notEqual(map, null);
	});

	it("has correct component count", () => {
		const { map } = parseWardleyMap(TEA_SHOP);
		assert.equal(map!.components.length, 10);
	});

	it("has correct dependency count", () => {
		const { map } = parseWardleyMap(TEA_SHOP);
		assert.equal(map!.dependencies.length, 8);
	});

	it("has correct evolution count", () => {
		const { map } = parseWardleyMap(TEA_SHOP);
		assert.equal(map!.evolutions.length, 1);
	});

	it("renders all 10 components", () => {
		const { map } = parseWardleyMap(TEA_SHOP);
		const svg = renderWardleyMap(map!);
		const circles = svg.match(/<circle/g) || [];
		assert.equal(circles.length, 10);
	});

	it("evolution preserves Y alignment", () => {
		const { map } = parseWardleyMap(TEA_SHOP);
		renderWardleyMap(map!);
		const kettle = map!.components.find((c) => c.name === "Kettle")!;
		const eKettle = map!.components.find((c) => c.name === "Electric Kettle")!;
		assert.equal(kettle.y, eKettle.y, "Kettle and Electric Kettle must share Y");
	});

	it("anchors are at top", () => {
		const { map } = parseWardleyMap(TEA_SHOP);
		renderWardleyMap(map!);
		const business = map!.components.find((c) => c.name === "Business")!;
		const pub = map!.components.find((c) => c.name === "Public")!;
		assert.equal(business.y, 0);
		assert.equal(pub.y, 0);
	});
});
