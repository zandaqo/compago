import {
  build,
  emptyDir,
} from "https://raw.githubusercontent.com/denoland/dnt/0.37.0/mod.ts";

const version = await Deno.readTextFile("./VERSION");

await emptyDir("npm");

await build({
  entryPoints: ["./mod.ts"],
  outDir: "./npm",
  typeCheck: false,
  test: false,
  declaration: "inline",
  scriptModule: false,
  compilerOptions: {
    target: "Latest",
    sourceMap: true,
    inlineSources: true,
    lib: ["ES2022", "DOM"],
  },
  shims: {
    deno: false,
    timers: false,
  },
  package: {
    name: "compago",
    version: version.trim(),
    main: "mod.js",
    type: "module",
    description: "A minimalist MVC framework for modern browsers.",
    keywords: [
      "framework",
      "frontend",
      "full-stack",
      "lit",
      "state",
      "reactive",
      "DDD",
    ],
    author: "Maga D. Zandaqo <denelxan@gmail.com> (http://maga.name)",
    license: "MIT",
    repository: {
      type: "git",
      url: "https://github.com/zandaqo/compago.git",
    },
    homepage: "https://github.com/zandaqo/compago#readme",
    bugs: {
      url: "https://github.com/zandaqo/compago/issues",
    },
    exports: {
      ".": {
        types: "./esm/mod.d.ts",
        import: "./esm/mod.js",
      },
      "./*": {
        types: "./esm/*.d.ts",
        import: "./esm/*.js",
      },
    },
  },
});

Deno.copyFileSync("LICENSE", "npm/LICENSE");
Deno.copyFileSync("README.md", "npm/README.md");
