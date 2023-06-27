# blog-cells
[![Node.js CI](https://github.com/rameshvarun/blog-cells/actions/workflows/node.js.yml/badge.svg)](https://github.com/rameshvarun/blog-cells/actions/workflows/node.js.yml)

<a href="https://rameshvarun.github.io/blog-cells/">
<p align="center"><img width="300px" src="./screenshot.png"></img></p>
<p align="center">[VIEW DEMO]</p>
</a>

Turn any web page into an interactive code notebook, similar to [Jupyter](https://jupyter.org/) or [ObservableHQ](https://observablehq.com/).

Just drop JS / CSS import tags onto your page start creating code cells using `<script type="text/notebook-cell">` elements. blog-cells will transform these script tags into interactive, runnable code snippets.

```html
<script type="text/notebook-cell">
console.log("Hello World!");
</script>

<!-- Import blog-cells after your cells are defined. -->
<script type="module" src="https://cdn.jsdelivr.net/gh/rameshvarun/blog-cells@0.1.0/dist/blog-cells.js"></script>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/rameshvarun/blog-cells@0.1.0/dist/blog-cells.css" />
```