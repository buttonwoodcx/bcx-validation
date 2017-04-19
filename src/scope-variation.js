import {createOverrideContext} from 'bcx-expression-evaluator';
import _ from 'lodash';

export default function (scope, variation) {
  if (_.isEmpty(variation)) return scope;

  const {bindingContext} = scope;
  const parentOverrideContext = _.get(scope, 'overrideContext.parentOverrideContext');

  const newBindingContext = {
    ...bindingContext,
    ...variation
  };

  const newOverrideContext = createOverrideContext(newBindingContext, parentOverrideContext);

  return {
    bindingContext: newBindingContext,
    overrideContext: newOverrideContext
  };
}