import { nodeResolve } from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import typescript from "@rollup/plugin-typescript";
import livereload from "rollup-plugin-livereload";
import serve from "rollup-plugin-serve";
import pkg from "./package.json";

const liveReloadOpt = {
  watch: ["src", "demo", "dist"],
  delay: 300,
};

const serveOptions = {
  // Launch in browser (default: false)
  open: true,
  openPage: "/demo/demo.html",
  port: 8080,
};

export default [
  // browser-friendly UMD build
  {
    input: "src/index.ts",
    output: {
      name: "cytoscape.js-visual-cues",
      file: pkg.browser,
      format: "umd",
      exports: "auto",
    },
    plugins: [
      nodeResolve(), // so Rollup can find `ms`
      commonjs(), // so Rollup can convert `ms` to an ES module
      typescript(),
      serve(serveOptions),
      livereload(liveReloadOpt),
    ],
  },
];
