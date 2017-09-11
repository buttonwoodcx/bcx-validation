import babel from 'rollup-plugin-babel';
import resolve from 'rollup-plugin-node-resolve';
import uglify from 'rollup-plugin-uglify';

export default {
  entry: 'src/index.js',
  format: 'umd',
  moduleName: 'BcxValidation',
  dest: 'dist/index.js',
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
