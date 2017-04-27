import _ from 'lodash';
import valueEvaluator from './value-evaluator';
import ValidationResult from './validation-result';
import scopeVariation from './scope-variation';

// provide override error message and early break support.
export default function (validator, opts = {}) {
  const {message,
         stopValidationChainIfPass,
         stopValidationChainIfFail} = opts;

  const messageEvaluator = message ?
                           valueEvaluator(message, {stringInterpolationMode: true}) :
                           null;
  return scope => {
    let result = new ValidationResult(validator(scope));
    const forceBreak = (result.isValid === true && stopValidationChainIfPass) ||
                    (result.isValid === false && stopValidationChainIfFail);

    const overrideMessage = (!result.isValid && messageEvaluator) ?
                            messageEvaluator(scopeVariation(scope, {$errors: result.errors})) :
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
