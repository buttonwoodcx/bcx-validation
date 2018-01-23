import babel from 'rollup-plugin-babel';
import resolve from 'rollup-plugin-node-resolve';
import uglify from 'rollup-plugin-uglify';

export default {
  input: 'src/index.js',
  output: {
    format: 'umd',
    name: 'BcxValidation',
    file: 'dist/index.js',
    globals: {
      "lodash": "_",
      "bcx-expression-evaluator": "BcxExpressionEvaluator"
    }
  },
  external: ["lodash", "bcx-expression-evaluator"],
  plugins: [
    resolve(),
    babel({
      exclude: 'node_modules/**',
    }),
    uglify()
  ]
};
