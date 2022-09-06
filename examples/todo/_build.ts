import * as esbuild from "https://deno.land/x/esbuild@v0.15.7/mod.js";
import { denoPlugin } from "https://deno.land/x/esbuild_deno_loader@0.5.2/mod.ts";

esbuild
  .build({
    plugins: [denoPlugin()],
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
