import { Plugin } from "obsidian";
import { parseWardleyMap } from "./parser";
import { renderWardleyMap } from "./renderer";

export default class WardleyMapPlugin extends Plugin {
	async onload() {
		console.log("Loading Wardley Map Simple plugin");

		// Register markdown code block processor for 'wardley' language
		this.registerMarkdownCodeBlockProcessor(
			"wardley",
			(source, el, ctx) => {
				this.renderWardleyBlock(source, el);
			}
		);
	}

	onunload() {
		console.log("Unloading Wardley Map Simple plugin");
	}

	/**
	 * Render a Wardley map code block
	 */
	private renderWardleyBlock(source: string, container: HTMLElement): void {
		// Clear container
		container.empty();

		// Parse the map
		const { map, errors } = parseWardleyMap(source);

		// Show errors if any
		if (errors.length > 0) {
			const errorDiv = container.createDiv({
				cls: "wardley-map-error",
			});

			errorDiv.createEl("h4", {
				text: "Wardley Map Parse Errors:",
			});

			const errorList = errorDiv.createEl("ul");
			for (const error of errors) {
				const li = errorList.createEl("li");
				li.setText(
					error.line > 0
						? `Line ${error.line}: ${error.message}`
						: error.message
				);
			}

			return;
		}

		// Render the map if no errors
		if (map) {
			const mapDiv = container.createDiv({
				cls: "wardley-map-container",
			});

			const svg = renderWardleyMap(map, {
				width: 800,
				height: 600,
				padding: 60,
				nodeRadius: 8,
				fontSize: 12,
			});

			mapDiv.innerHTML = svg;
		}
	}
}
