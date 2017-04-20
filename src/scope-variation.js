import {createScope} from 'bcx-expression-evaluator';
import _ from 'lodash';

export default function (scope, variation) {
  if (_.isEmpty(variation)) return scope;

  let [bindingContext, ...parents] = scope;
  const newBindingContext = {
    ...bindingContext,
    ...variation
  };

  return createScope(newBindingContext, ...parents);
}