import {
  build,
  emptyDir,
} from "https://raw.githubusercontent.com/denoland/dnt/0.37.0/mod.ts";

await emptyDir("npm");

await build({
  entryPoints: ["./counter.ts"],
  outDir: "./npm",
  typeCheck: false,
  test: false,
  declaration: "inline",
  scriptModule: false,
  compilerOptions: {
    target: "Latest",
    sourceMap: true,
    inlineSources: true,
  },
  shims: {
    deno: false,
    timers: false,
  },
  package: {
    private: true,
    name: "compago-example-counter",
    version: "0.0.1",
    main: "counter.js",
    type: "module",
    description: "An example of a Web Component written with Deno",
    keywords: [
      "web component",
      "deno",
      "lit",
      "compago",
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
  },
});
