import { build } from "https://raw.githubusercontent.com/denoland/dnt/0.15.0/mod.ts";

await Deno.remove("npm", { recursive: true }).catch((_) => {});

await build({
  entryPoints: ["./mod.ts"],
  outDir: "./npm",
  typeCheck: false,
  test: false,
  cjs: false,
  declaration: true,
  compilerOptions: {
    target: "Latest",
    sourceMap: true,
    inlineSources: true,
  },
  mappings: {
    "https://cdn.esm.sh/v57/lit-html@2.1.1/directive.js": {
      name: "lit-html",
      version: "^2.1.0",
      subPath: "directive.js",
    },
    "https://cdn.esm.sh/v57/@lit/reactive-element@1.2.0": {
      name: "@lit/reactive-element",
      version: "^1.1.0",
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
      "mvc",
      "framework",
      "client-side",
      "frontend",
    ],
    author: "Maga D. Zandaqo <denelxan@gmail.com> (http://maga.name)",
    license: "MIT",
    files: [
      "*.js",
      "*.js.map",
      "*.d.ts",
    ],
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
  },
});
const decoder = new TextDecoder();
const packageJson = JSON.parse(
  decoder.decode(Deno.readFileSync("./npm/package.json")),
);

console.log("[build] Flatten directory tree...");
for (const dir of ["esm", "types"]) {
  for await (const entry of Deno.readDir(`./npm/${dir}`)) {
    if (!entry.isFile) continue;
    if (entry.name.endsWith(".js") || entry.name.endsWith(".d.ts")) {
      Deno.renameSync(`./npm/${dir}/${entry.name}`, `./npm/${entry.name}`);
    } else if (entry.name.endsWith(".js.map")) {
      // fix source paths
      const source = JSON.parse(
        decoder.decode(Deno.readFileSync(`./npm/${dir}/${entry.name}`)),
      );
      source.sources = [
        entry.name.substring(0, entry.name.indexOf(".")) + ".ts",
      ];
      Deno.writeTextFileSync(`./npm/${entry.name}`, JSON.stringify(source));
    }
  }
  Deno.removeSync(`./npm/${dir}`, { recursive: true });
}

console.log("[build] Copy docs...");
Deno.copyFileSync("LICENSE", "npm/LICENSE");
Deno.copyFileSync("README.md", "npm/README.md");

console.log("[build] Fix package.json...");
delete packageJson.exports;
delete packageJson.types;
delete packageJson.module;
Deno.writeFileSync(
  "./npm/package.json",
  new TextEncoder().encode(JSON.stringify(packageJson)),
);
await Deno.remove("npm/package-lock.json").catch((_) => {});
console.log("[build] Done!");
