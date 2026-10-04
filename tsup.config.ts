import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  target: "node18",
  platform: "node",
  outDir: "dist",
  clean: true,
  dts: false,
  sourcemap: true,
  splitting: false,
  bundle: true,
  external: ["better-sqlite3"],
  noExternal: ["groq-sdk", "zod"],
  esbuildOptions: (options) => {
    options.banner = {
      js: '#!/usr/bin/env node',
    };
  },
});