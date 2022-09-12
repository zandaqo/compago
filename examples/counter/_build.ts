import {
  build,
  emptyDir,
} from "https://raw.githubusercontent.com/denoland/dnt/0.30.0/mod.ts";

await emptyDir("npm");

await build({
  entryPoints: ["./counter.ts"],
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
    "https://cdn.skypack.dev/lit@2.3.1?dts": {
      name: "lit",
      version: "^2.3.1",
      peerDependency: true,
    },
    "https://cdn.skypack.dev/lit@2.3.1/decorators.js?dts": {
      name: "lit",
      version: "^2.3.1",
      subPath: "decorators.js",
      peerDependency: true,
    },
    "https://cdn.skypack.dev/compago@5.0.2": {
      name: "compago",
      version: "^5.0.2",
      peerDependency: true,
    },
  },
  shims: {
    deno: false,
    timers: false,
  },
  package: {
    private: true,
    name: "compago-example-counter",
    version: Deno.args[0],
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
