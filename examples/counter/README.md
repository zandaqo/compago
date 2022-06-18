# Counter Web Component

A web component example using Deno, Lit, and Compago.

## Development & Usage

The component is authored with Deno and requires no additional tooling for
development. It uses the built-in Deno formatter, linter, test runner, and
building tools to produce an NPM package for Node.js and browser:

```
// check formatting
deno fmt --check
// lint
deno lint
// test
deno task test
// build an NPM package
deno task build
```

## Known Issues

1. Deno's formatter (dprint) doesn't yet support formatting HTML inside template
   strings producing at times awkward output.
   - [Format html tagged template text](https://github.com/dprint/dprint-plugin-typescript/issues/9)
2. We cannot use class fields for defining reactive properties since Deno
   doesn't support setting `useDefineForClassFields` to `false`, thus, class
   fields set on an instance overshadow reactive accessors set on prototype.
   - [Avoiding issues with class fields when declaring properties](https://lit.dev/docs/components/properties/#avoiding-issues-with-class-fields)
   - [Why is useDefineForClassFields non-overridable?](https://github.com/denoland/deno/issues/12393)
