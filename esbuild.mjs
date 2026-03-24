import * as esbuild from "esbuild";

const isWatch = process.argv.includes("--watch");
const isProduction = process.argv.includes("--production");

/** @type {import('esbuild').BuildOptions} */
const extensionOptions = {
  entryPoints: ["src/extension.ts"],
  bundle: true,
  outfile: "dist/extension.js",
  external: ["vscode"],
  format: "cjs",
  platform: "node",
  target: "es2022",
  sourcemap: !isProduction,
  minify: isProduction,
};

/** @type {import('esbuild').BuildOptions} */
const webviewBaseOptions = {
  bundle: true,
  format: "iife",
  platform: "browser",
  target: "es2020",
  sourcemap: !isProduction,
  minify: isProduction,
  jsx: "automatic",
};

/** @type {import('esbuild').BuildOptions} */
const tankPanelOptions = {
  ...webviewBaseOptions,
  entryPoints: ["src/webview/tank-panel/index.tsx"],
  outfile: "dist/webview-tank-panel.js",
};

/** @type {import('esbuild').BuildOptions} */
const companionOptions = {
  ...webviewBaseOptions,
  entryPoints: ["src/webview/companion/index.tsx"],
  outfile: "dist/webview-companion.js",
};

async function buildAll() {
  await Promise.all([
    esbuild.build(extensionOptions),
    esbuild.build(tankPanelOptions),
    esbuild.build(companionOptions),
  ]);
  console.log("Build complete.");
}

if (isWatch) {
  const [extCtx, tankCtx, compCtx] = await Promise.all([
    esbuild.context(extensionOptions),
    esbuild.context(tankPanelOptions),
    esbuild.context(companionOptions),
  ]);
  await Promise.all([extCtx.watch(), tankCtx.watch(), compCtx.watch()]);
  console.log("Watching for changes...");
} else {
  await buildAll();
}
