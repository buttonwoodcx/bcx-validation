import _ from 'lodash';
import {Parser} from 'bcx-expression-evaluator';

const parser = new Parser();

export default function (input, opts) {

  if (_.isString(input) && _.trim(input).length) {
    const expression = parser.parse(input, opts);
    return scope => expression.evaluate(scope);
  }

  if (_.isRegExp(input)) {
    const getValue = parser.parse('$value');

    return scope => {
      const value = getValue.evaluate(scope);
      return input.test(value);
    };
  }

  if (_.isFunction(input)) {
    const func = input;
    // from current context
    const getValue         = parser.parse('$value');
    const getPath          = parser.parse('$propertyPath');
    const getContext       = parser.parse('$this');
    const getNeighbours    = parser.parse('$neighbours');
    // from parent context
    const getParentContext = parser.parse('$parent');

    return scope => {
      const value = getValue.evaluate(scope);
      const propertyPath = getPath.evaluate(scope);
      const context = getContext.evaluate(scope);
      const neighbours = getNeighbours.evaluate(scope);
      const parentContext = getParentContext.evaluate(scope);

      return func(value, propertyPath, context, neighbours, parentContext);
    };
  }

  // unknown input returns undefined.
}
