# Todo

The classic Todo app example using Deno, Lit, and Compago.

## Development

### Formatting, Linting, Testing

You know
[the drill](https://github.com/zandaqo/compago/tree/master/examples/counter#development)--all
the standard Deno tools are at your disposal. Mind the current
[limitations](https://github.com/zandaqo/compago/tree/master/examples/counter#known-issues),
though.

### Building

```
deno task build
```

This will bundle our app into `main.js` file that is imported into `index.html`.

Under the hood, we use [esbuild](https://esbuild.github.io/) with the
[esbuild_deno_loader](https://deno.land/x/esbuild_deno_loader) to create the
bundle. There are other ways to do it using Deno, but `esbuild` is better and
works fine with deno.
