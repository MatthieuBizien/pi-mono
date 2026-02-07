import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { SettingsManager } from "../src/core/settings-manager.js";

describe("SettingsManager project settings discovery", () => {
	let tempDir: string;

	beforeEach(() => {
		tempDir = join(tmpdir(), `settings-test-${Date.now()}-${Math.random().toString(36).slice(2)}`);
		mkdirSync(tempDir, { recursive: true });
	});

	afterEach(() => {
		rmSync(tempDir, { recursive: true, force: true });
	});

	it("should find settings.json in current directory", () => {
		const settingsPath = join(tempDir, ".pi", "settings.json");
		mkdirSync(dirname(settingsPath), { recursive: true });
		writeFileSync(settingsPath, JSON.stringify({ theme: "dark" }));

		const manager = SettingsManager.create(tempDir, join(tempDir, "agent"));
		expect(manager.getTheme()).toBe("dark");
		expect(manager.getProjectConfigDir()).toBe(join(tempDir, ".pi"));
	});

	it("should find settings.json in parent directory", () => {
		const settingsPath = join(tempDir, ".pi", "settings.json");
		const subdir = join(tempDir, "docs");
		mkdirSync(dirname(settingsPath), { recursive: true });
		mkdirSync(subdir, { recursive: true });
		writeFileSync(settingsPath, JSON.stringify({ theme: "ocean" }));

		const manager = SettingsManager.create(subdir, join(tempDir, "agent"));
		expect(manager.getTheme()).toBe("ocean");
		expect(manager.getProjectConfigDir()).toBe(join(tempDir, ".pi"));
	});

	it("should find settings.json multiple levels up", () => {
		const settingsPath = join(tempDir, ".pi", "settings.json");
		const deepDir = join(tempDir, "src", "core", "utils");
		mkdirSync(dirname(settingsPath), { recursive: true });
		mkdirSync(deepDir, { recursive: true });
		writeFileSync(settingsPath, JSON.stringify({ theme: "minimal" }));

		const manager = SettingsManager.create(deepDir, join(tempDir, "agent"));
		expect(manager.getTheme()).toBe("minimal");
		expect(manager.getProjectConfigDir()).toBe(join(tempDir, ".pi"));
	});

	it("should fall back to cwd/.pi when no settings found", () => {
		const subdir = join(tempDir, "empty-project", "docs");
		mkdirSync(subdir, { recursive: true });

		const manager = SettingsManager.create(subdir, join(tempDir, "agent"));
		expect(manager.getTheme()).toBeUndefined();
		expect(manager.getProjectConfigDir()).toBe(join(subdir, ".pi"));
	});

	it("should use closest settings.json when multiple exist", () => {
		// Root settings
		const rootSettings = join(tempDir, ".pi", "settings.json");
		mkdirSync(dirname(rootSettings), { recursive: true });
		writeFileSync(rootSettings, JSON.stringify({ theme: "root-theme" }));

		// Nested project settings (closer to cwd)
		const nestedDir = join(tempDir, "packages", "sub");
		const nestedSettings = join(nestedDir, ".pi", "settings.json");
		mkdirSync(dirname(nestedSettings), { recursive: true });
		writeFileSync(nestedSettings, JSON.stringify({ theme: "nested-theme" }));

		// From nested dir, should find the closest one
		const manager = SettingsManager.create(nestedDir, join(tempDir, "agent"));
		expect(manager.getTheme()).toBe("nested-theme");
		expect(manager.getProjectConfigDir()).toBe(join(nestedDir, ".pi"));
	});

	it("should return correct getProjectConfigDir for inMemory with cwd", () => {
		const manager = SettingsManager.inMemory({}, tempDir);
		expect(manager.getProjectConfigDir()).toBe(join(tempDir, ".pi"));
	});
});
