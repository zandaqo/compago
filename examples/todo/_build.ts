import * as esbuild from "https://deno.land/x/esbuild@v0.17.19/mod.js";
import { denoPlugins } from "https://deno.land/x/esbuild_deno_loader@0.8.0/mod.ts";

esbuild
  .build({
    plugins: [...denoPlugins({
      nodeModulesDir: true,
    })],
    entryPoints: ["./main.ts"],
    outfile: "./main.js",
    target: "es2022",
    format: "esm",
    bundle: true,
    minify: true,
    sourcemap: true,
  })
  .then(() => Deno.exit(0))
  .catch(() => Deno.exit(1));
