import {
  build,
  emptyDir,
} from "https://raw.githubusercontent.com/denoland/dnt/0.23.0/mod.ts";

await emptyDir("npm");

await build({
  entryPoints: ["./mod.ts"],
  outDir: "./npm",
  typeCheck: false,
  test: false,
  declaration: true,
  scriptModule: false,
  compilerOptions: {
    target: "Latest",
    sourceMap: true,
    inlineSources: true,
  },
  mappings: {
    "https://cdn.esm.sh/v82/lit-html@2.2.4/es2022/directive.js": {
      name: "lit-html",
      version: "^2.2.4",
      subPath: "directive.js",
    },
    "https://cdn.esm.sh/v82/lit-html@2.2.4/directive.d.ts": {
      name: "lit-html",
      version: "^2.2.4",
      subPath: "directive.js",
    },
    "https://cdn.esm.sh/v64/lit-element@3.2.0/es2022/lit-element.js": {
      name: "lit-element",
      version: "^3.2.0",
    },
    "https://cdn.esm.sh/v82/@lit/reactive-element@1.3.2": {
      name: "@lit/reactive-element",
      version: "^1.3.2",
    },
  },
  shims: {
    deno: false,
    timers: false,
  },
  package: {
    name: "compago",
    version: Deno.args[0],
    main: "mod.js",
    type: "module",
    description: "A minimalist MVC framework for modern browsers.",
    keywords: [
      "framework",
      "frontend",
      "full-stack",
      "lit",
    ],
    author: "Maga D. Zandaqo <denelxan@gmail.com> (http://maga.name)",
    license: "MIT",
    repository: {
      type: "git",
      url: "https://github.com/zandaqo/structurae.git",
    },
    homepage: "https://github.com/zandaqo/structurae#readme",
    bugs: {
      url: "https://github.com/zandaqo/structurae/issues",
    },
    engines: {
      node: ">=14.0.0",
    },
    exports: {
      "./*": {
        import: "./esm/*.js",
        types: "./types/*.d.ts",
      },
    },
  },
});

Deno.copyFileSync("LICENSE", "npm/LICENSE");
Deno.copyFileSync("README.md", "npm/README.md");
