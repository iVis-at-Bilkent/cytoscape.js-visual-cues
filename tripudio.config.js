import typescript from "@rollup/plugin-typescript";
import pkg from "./package.json";
import { terser } from "rollup-plugin-terser";

export default [
  {
    input: "src/index.ts",
    external: [],
    plugins: [
      typescript(), // so Rollup can convert TypeScript to JavaScript
    ],
    output: [
      {
        file: pkg.module,
        format: "es",
        exports: "auto",
        plugins: [
          terser({
            compress: { sequences: false, negate_iife: false },
          }),
        ],
      },
    ],
  },
];
