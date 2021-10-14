try {
  const importMap = JSON.parse(
    new TextDecoder().decode(Deno.readFileSync("./import-map.json")),
  ).imports;
  const reversedImportMap: Array<[string, string]> = [];
  for (const [key, value] of Object.entries(importMap)) {
    reversedImportMap.push([value as string, key]);
  }
  const { files } = await Deno.emit("mod.ts", {
    compilerOptions: {
      "target": "esnext",
      "module": "esnext",
      "sourceMap": true,
      "inlineSources": true,
      "declaration": true,
      "removeComments": false,
      "useDefineForClassFields": false,
      "lib": [
        "dom",
        "dom.iterable",
        "dom.asynciterable",
        "deno.ns",
        "deno.unstable",
      ],
    },
    importMapPath: "./import-map.json",
  });
  for (const [fileName, text] of Object.entries(files)) {
    const isJS = fileName.endsWith(".js");
    const isDTS = !isJS && fileName.endsWith(".d.ts");
    const name = fileName.substring(
      fileName.lastIndexOf("/") + 1,
      fileName.indexOf("."),
    );
    const isLocal = fileName.startsWith("file:");
    const path = isLocal
      ? fileName.replace(/file\:\/\/\//g, "")
        .replace(/\.ts\./g, ".")
      : fileName; // remove .ts extenstion
    let content = text;
    if (isJS || isDTS) {
      content = text.replace(/\.ts";/g, isDTS ? '";' : '.js";') // remove .ts extension
        .replace(/^\/\/\/.*?\/>\s/g, "") // remove triple slash comments
        .replace(/import\("(.*?)"\)/g, (_, path: string) => { // replace url imports with paths
          let result = path;
          for (const [url, prefix] of reversedImportMap) {
            if (path.startsWith(url)) {
              result = path.replace(url, prefix).replace(/\.d\.ts$/g, "");
            }
          }
          return `import("${result}")`;
        });
      if (isJS) {
        content += `\n//# sourceMappingURL=${name + ".js.map"}`; // add link to source file
      }
    } else if (path.endsWith(".js.map")) {
      const source = JSON.parse(text);
      source.file = name + ".js";
      source.sources = [name + ".ts"];
      content = JSON.stringify(source);
    }
    if (isLocal) Deno.writeTextFileSync(path, content);
  }
  console.log("Done!");
} catch (e) {
  console.log(e);
}
