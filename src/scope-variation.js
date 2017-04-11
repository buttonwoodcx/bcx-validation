import {createOverrideContext, createSimpleScope} from 'bcx-expression-evaluator';
import _ from 'lodash';

export default function (scope, variation) {
  if (_.isEmpty(variation)) return scope;

  const {bindingContext} = scope;
  const parentBindingContext = _.get(scope, 'overrideContext.parentOverrideContext.bindingContext');

  const newBindingContext = {
    ...bindingContext,
    ...variation
  };

  return createSimpleScope(newBindingContext, parentBindingContext);
}