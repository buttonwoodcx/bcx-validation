import {createScope} from 'bcx-expression-evaluator';
import _ from 'lodash';

export function modifiedOverrideContext(overrideContext, variation) {
  return {...overrideContext, ...variation};
}

export default function (scope, variation) {
  if (_.isEmpty(variation)) return scope;
  let {bindingContext, overrideContext} = scope;
  return {bindingContext, overrideContext: modifiedOverrideContext(overrideContext, variation)};
}