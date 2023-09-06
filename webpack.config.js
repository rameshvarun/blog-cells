const webpack = require("webpack");
const path = require("path");
const CopyPlugin = require("copy-webpack-plugin");
const { merge } = require('webpack-merge');

const common = {
    entry: "./src/blog-cells.tsx",
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          use: "ts-loader",
          exclude: /node_modules/
        },
      ],
      parser: {
        javascript: {
          importMeta: false
        }
      }
    },
    resolve: {
      extensions: [".tsx", ".ts", ".js"]
    },
    output: {
      filename: "blog-cells.js",
      path: path.resolve(__dirname, "dist"),
      library: {
        name: "BlogCells",
        type: "window"
      }
    },
    plugins: [
      new CopyPlugin({
        patterns: [
          { from: "src/three-dots.svg", to: "." },
          { from: "src/blog-cells.css", to: "." },
          { from: "src/index.html", to: "." },
        ]
      }),
    ]
};

const development = {
  mode: "development",
  devtool: "inline-source-map",
  devServer: {
    host: "local-ipv4",
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
      "Access-Control-Allow-Headers": "X-Requested-With, content-type, Authorization"
    }
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        { from: "src/test.html", to: "." },
      ]
    }),
  ]
};

const production = {
  mode: "production",
  devtool: "source-map",
};

module.exports = env => {
  if (env.mode === "production") return merge(common, production);
  else if (env.mode === "development") return merge(common, development);
  else throw new Error(`Unknown mode: ${env.mode}`);
};