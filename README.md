# blog-cells
[![Node.js CI](https://github.com/rameshvarun/blog-cells/actions/workflows/node.js.yml/badge.svg)](https://github.com/rameshvarun/blog-cells/actions/workflows/node.js.yml)
[![npm](https://img.shields.io/npm/v/blog-cells)](https://www.npmjs.com/package/blog-cells)

<a href="https://rameshvarun.github.io/blog-cells/">
<p align="center"><img width="400px" src="./screenshot.png"></img></p>
<p align="center">[VIEW DEMO]</p>
</a>

Add interactive code cells to any webpage, similar to [Jupyter](https://jupyter.org/) or [ObservableHQ](https://observablehq.com/). Works with direct HTML editing, static site generators like Jekyll / Hugo, and more.

## Usage

### Quickstart

Just drop in JS / CSS imports and start creating code cells using `<script type="text/notebook-cell">` elements. <b>blog-cells</b> will transform these script tags into interactive, runnable code snippets.

```html
<!-- Import blog-cells JS and CSS files. -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/blog-cells@0.7.0/dist/blog-cells.css" />
<script src="https://cdn.jsdelivr.net/npm/blog-cells@0.7.0/dist/blog-cells.js"></script>

<!-- Create your code cells in script tags -->
<script type="text/notebook-cell">
console.log("Hello World!");
</script>
```

Try it on [CodePen](https://codepen.io/varunramesh/pen/WNYVNQQ) or [JSFiddle](https://jsfiddle.net/varunramesh/o217xpc5/9/).

### Other Languages

In addition to JavaScript, you can also embed code in other languages by adding a `data-kernel` attribute.

```html
<script type="text/notebook-cell" data-kernel="python">
print("Hello World!");
</script>
```

The following kernel values are currently supported:
- `javascript` (Default)
- `python`

### Cell Attributes

Cells can be configured with the following attributes:

- `data-autorun="true"` - Automatically run a cell on page load. Autorun cells are run in the order that they appear on the page.
- `data-hidden="true"` - Make a cell hidden by default - readers can toggle the cell's visibility.

### Using `<pre>` tags instead of `<script>` tags

Script tags are great for defining notebook cells since they can hold pretty much any code without escaping. However, you can also use `<pre class="notebook-cell">` tags instead. When using `pre` tags, reserved HTML characters should be escaped using HTML entities (this can be done by your static site generator).

```html
<pre class="notebook-cell">
console.log("&lt;b&gt;HELLO&lt;/b&gt;");
</pre>
```

### Creating a Custom Kernel

You can easily define and use your own custom kernels.

```html
<!-- Import blog-cells JS and CSS files. -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/blog-cells@0.7.0/dist/blog-cells.css" />
<script src="https://cdn.jsdelivr.net/npm/blog-cells@0.7.0/dist/blog-cells.js"></script>

<!-- Define custom kernel -->
<script>
class JSONFormatKernel extends BlogCells.Kernel {
  async run(code, onOutput) {
    const data = JSON.parse(code.trim());
    onOutput({ type: "log", line: JSON.stringify(data, undefined, 2) });
  }
}
BlogCells.registerKernel("json-format", () => new JSONFormatKernel());
</script>
  
<!-- Use custom Kernel -->
<script type="text/notebook-cell" data-kernel="json-format">
[4, {"hello": 3}]
</script>
```

## Developing

```bash
git clone https://github.com/rameshvarun/blog-cells.git
cd blog-cells
npm install
npm start
```

## Attributions

This repo contains assets from other open source projects.

- [https://github.com/SamHerbert/SVG-Loaders](https://github.com/SamHerbert/SVG-Loaders) (MIT)

## Alternatives
- https://starboard.gg/
- https://observablehq.com/
- https://jupyter.org/try-jupyter/lab/
- https://www.typecell.org/
