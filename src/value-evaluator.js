import _ from 'lodash';
import {Parser} from 'bcx-expression-evaluator';

const parser = new Parser();

export default function (input, opts) {

  if (_.isString(input)) {
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
    const getPropertyName  = parser.parse('$propertyName');
    const getContext       = parser.parse('$this');
    const getNeighbours    = parser.parse('$neighbours');
    // from parent context
    const getParentContext = parser.parse('$parent');

    return scope => {
      const value = getValue.evaluate(scope);
      const propertyName = getPropertyName.evaluate(scope);
      const context = getContext.evaluate(scope);
      const neighbours = getNeighbours.evaluate(scope);
      const parentContext = getParentContext.evaluate(scope);

      return func(value, propertyName, context, neighbours, parentContext);
    };
  }

  throw new Error(`Unsupported input: ${input}`);
}
