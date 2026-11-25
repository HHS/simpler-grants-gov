import commonjs from "@rollup/plugin-commonjs";
import typescript from "@rollup/plugin-typescript";
import { nodeResolve } from "@rollup/plugin-node-resolve";

const config = {
  input: "index.ts",
  output: {
    dir: "dist",
    format: "cjs",
  },
  plugins: [commonjs(), nodeResolve(), typescript()],
};

export default config;
