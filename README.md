# blog-cells
[![Node.js CI](https://github.com/rameshvarun/blog-cells/actions/workflows/node.js.yml/badge.svg)](https://github.com/rameshvarun/blog-cells/actions/workflows/node.js.yml)

<a href="https://rameshvarun.github.io/blog-cells/">
<p align="center"><img width="400px" src="./screenshot.png"></img></p>
<p align="center">[VIEW DEMO]</p>
</a>

Add interactive code cells to any webpage, similar to [Jupyter](https://jupyter.org/) or [ObservableHQ](https://observablehq.com/). Works with direct HTML editing, static site generators like Jekyll / Hugo, and much more.

Just drop in JS / CSS imports and start creating code cells using `<script type="text/notebook-cell">` elements. <b>blog-cells</b> will transform these script tags into interactive, runnable code snippets.

Try it on [CodePen](https://codepen.io/varunramesh/pen/WNYVNQQ) or [JSFiddle](https://jsfiddle.net/varunramesh/o217xpc5/8/).

```html
<script type="text/notebook-cell">
console.log("Hello World!");
</script>

<!-- Import blog-cells after your cells are defined. -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/rameshvarun/blog-cells@0.3.0/dist/blog-cells.css" />
<script type="module" src="https://cdn.jsdelivr.net/gh/rameshvarun/blog-cells@0.3.0/dist/blog-cells.js"></script>
```

## pre.notebook-cell

If you want to fallback properly in noscript cases, instead of script tags, you can use `<pre class="notebook-cell">` elements, however reserved HTML characters should be escaped using [HTML entities](https://developer.mozilla.org/en-US/docs/Glossary/Entity). I recommend setting up your static-site generator to do this (TODO: Examples).

## Alternatives
- https://starboard.gg/
- https://observablehq.com/
- https://jupyter.org/try-jupyter/lab/
- https://www.typecell.org/
