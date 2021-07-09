import _ from 'lodash';
import valueEvaluator from './value-evaluator';
import ValidationResult from './validation-result';
import scopeVariation from './scope-variation';

// provide override error message and early break support.
export default function (validator, opts = {}) {
  const {message,
         stopValidationChainIfPass,
         stopValidationChainIfFail} = opts;

  let messageEvaluator;

  if (message) {
    messageEvaluator = valueEvaluator(message, true);
  }

  return scope => {
    let _validator = validator;
    let _scope = scope;

    if (validator.$patchScope && validator.$validator) {
      _scope = validator.$patchScope(scope);
      _validator = validator.$validator;
    }

    let result = new ValidationResult(_validator(_scope));
    const forceBreak = (result.isValid === true && stopValidationChainIfPass) ||
                    (result.isValid === false && stopValidationChainIfFail);

    const overrideMessage = (!result.isValid && messageEvaluator) ?
                            messageEvaluator(scopeVariation(_scope, {
                              // use original scope $value, not overrided value
                              $value: scope.$value,
                              // pass original errors
                              $errors: result.errors
                            })) :
                            null;

    if (forceBreak || overrideMessage) {
      result = new ValidationResult({
        isValid: result.isValid,
        errors: overrideMessage ? [overrideMessage] : result.errors,
        break: result.break || forceBreak
      });
    }

    return result;
  };
}
