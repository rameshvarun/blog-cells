const webpack = require("webpack");
const path = require("path");
const CopyPlugin = require("copy-webpack-plugin");

module.exports = {
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
      path: path.resolve(__dirname, "dist")
    },
    optimization: {
        minimize: false
    },
    devtool: "source-map",
    plugins: [
      new CopyPlugin({
        patterns: [
          { from: "src/three-dots.svg", to: "." },
          { from: "src/blog-cells.css", to: "." }
        ]
      }),
    ]
};