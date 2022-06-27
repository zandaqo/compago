# Counter

A web component example using Deno, Lit, and Compago.

## Development

The component is authored with Deno and requires no additional tooling for
development. It uses the built-in Deno formatter, linter, test runner, and
building tools to produce an NPM package for Node.js and browser.

### Formatting

```bash
deno fmt
```

Deno's formatter (`dprint`) takes care of formatting most file types, just use
`deno fmt` to format and `deno fmt --check` to check formatting. The formatter,
however, doesn't yet support formatting html in tagged templates, so feel free
to nag the Deno developers in the issue tracker:

- [Format html tagged template text](https://github.com/dprint/dprint-plugin-typescript/issues/9)

### Linting

```bash
deno lint
```

### Testing

```bash
deno task test
```

Deno's built-in test runner `deno test` is perfect for writing unit tests for
our component. For a passable DOM implementation we can use `JSDOM`. You can
check the working example in the
[`couter_test.ts`](https://github.com/zandaqo/compago/blob/master/examples/counter/counter_test.ts)
file.

### Building

```bash
deno task build
```

While our resulting source code is readily available for consumption by Deno, we
often need to use it with Node.js based toolchains and bundlers. Here we use a
small build
[script](https://github.com/zandaqo/compago/blob/master/examples/counter/_build.ts)
that uses Deno's `dnt` to produce an NPM package that exports our component as a
ESM module with peer dependencies on Lit and Compago.

## Known Issues

1. the formatter (`dprint`) doesn't yet support formatting HTML inside template
   strings:
   - [Format html tagged template text](https://github.com/dprint/dprint-plugin-typescript/issues/9)
2. We cannot use class fields for defining reactive properties since Deno
   doesn't support setting `useDefineForClassFields` to `false`, thus, class
   fields set on an instance overshadow reactive accessors set on prototype.
   - [Avoiding issues with class fields when declaring properties](https://lit.dev/docs/components/properties/#avoiding-issues-with-class-fields)
   - [Why is useDefineForClassFields non-overridable?](https://github.com/denoland/deno/issues/12393)
