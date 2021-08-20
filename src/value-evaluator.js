import _ from 'lodash';
import ScopedEval from 'scoped-eval';

const scopedEval = new ScopedEval();
const expCache = Object.create(null);
const interoperationCache = Object.create(null);

function build(expression, stringInterpolationMode = false) {
  const cache = stringInterpolationMode ? interoperationCache : expCache;
  if (!cache[expression]) {
    try {
      cache[expression] = scopedEval.build(expression, stringInterpolationMode);
    } catch (e) {
      throw new Error(`Failed to parse expression: ${JSON.stringify(expression)}\n${e.message}`);
    }
  }
  return cache[expression];
}

export default function (input, stringInterpolation) {
  if (_.isString(input) && _.trim(input).length) {
    const func = build(input, stringInterpolation);
    return scope => {
      try {
        return func(scope);
      } catch (e) {
        throw new Error(`Failed to execute expression: ${JSON.stringify(input)}\n${e.message}`);
      }
    };
  }

  if (_.isRegExp(input)) {
    return scope => {
      return input.test(scope.$value);
    };
  }

  if (_.isFunction(input)) {
    const func = input;

    return scope => {
      const value = scope.$value;
      const propertyPath = scope.$propertyPath;
      const context = scope.$this;
      const get = expression => {
        const func = build(expression);
        try {
          return func(scope);
        } catch (e) {
          throw new Error(`Failed to execute expression: ${JSON.stringify(input)}\n${e.message}`);
        }
      };

      return func(value, propertyPath, context, get);
    };
  }

  // unknown input returns undefined.
}
