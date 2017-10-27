import babel from 'rollup-plugin-babel';
import resolve from 'rollup-plugin-node-resolve';
import uglify from 'rollup-plugin-uglify';

export default {
  input: 'src/index.js',
  output: {
    format: 'umd',
    file: 'dist/index.js',
  },
  name: 'BcxValidation',
  external: ["lodash", "bcx-expression-evaluator"],
  globals: {
    "lodash": "_",
    "bcx-expression-evaluator": "BcxExpressionEvaluator"
  },
  plugins: [
    resolve(),
    babel({
      exclude: 'node_modules/**',
    }),
    uglify()
  ]
};
