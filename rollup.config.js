import { nodeResolve } from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import typescript from "@rollup/plugin-typescript";
import pkg from "./package.json";
import { terser } from "rollup-plugin-terser";

const isProduction = process.env.NODE_ENV === "production";

export default [
  // browser-friendly UMD build
  {
    input: "src/index.ts",
    output: {
      name: "cytoscape.js-visual-cues",
      file: pkg.browser,
      format: "umd",
      exports: "auto",
      plugins: [isProduction && terser()],
      globals: {
        html2canvas: 'html2canvas', // Specify the global variable for html2canvas
      }
    },
    plugins: [
      nodeResolve(), // so Rollup can find `ms`
      commonjs(), // so Rollup can convert `ms` to an ES module
      typescript(), // so Rollup can convert TypeScript to JavaScript
    ],
    external: ['html2canvas']
  },

  // CommonJS (for Node) and ES module (for bundlers) build.
  // (We could have three entries in the configuration array
  // instead of two, but it's quicker to generate multiple
  // builds from a single configuration where possible, using
  // an array for the `output` option, where we can specify
  // `file` and `format` for each target)
  {
    input: "src/index.ts",
    external: [],
    plugins: [
      typescript(), // so Rollup can convert TypeScript to JavaScript
    ],
    output: [
      {
        file: pkg.main,
        format: "cjs",
        exports: "auto",
        plugins: [isProduction && terser()],
      },
      {
        file: pkg.module,
        format: "es",
        exports: "auto",
        plugins: [isProduction && terser()],
      },
    ],
  },
];
