import _ from 'lodash';
import {Parser} from 'bcx-expression-evaluator';

const parser = new Parser();

export default function (input, opts) {

  if (_.isString(input) && _.trim(input).length) {
    const expression = parser.parse(input, opts);
    return scope => expression.evaluate(scope);
  }

  if (_.isRegExp(input)) {
    return scope => {
      return input.test(scope.overrideContext.$value);
    };
  }

  if (_.isFunction(input)) {
    const func = input;

    return scope => {
      const value = scope.overrideContext.$value;
      const propertyPath = scope.overrideContext.$propertyPath;
      const context = scope.overrideContext.bindingContext;
      const get = expression => parser.parse(expression).evaluate(scope);

      return func(value, propertyPath, context, get);
    };
  }

  // unknown input returns undefined.
}
