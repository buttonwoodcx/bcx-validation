import _ from 'lodash';
import valueEvaluator from './value-evaluator';
import validatorChain from './validator-chain';
import ValidationResult from './validation-result';

const rawValidator = valueEvaluator;

// provide override error message and early break support.
function standardValidatorWrap(validator, opts = {}) {
  const {message,
         stopValidationChainIfPass,
         stopValidationChainIfFail} = opts;

  const messageEvaluator = message ?
                           valueEvaluator(message, {stringInterpolationMode: true}) :
                           null;
  return scope => {
    let result = new ValidationResult(validator(scope));
    const forceBreak = (result.isValid && stopValidationChainIfPass) ||
                    (!result.isValid && stopValidationChainIfFail);

    const overrideMessage = (!result.isValid && messageEvaluator) ?
                            messageEvaluator(scope) :
                            null;

    if (forceBreak || overrideMessage) {
      result = new ValidationResult({
        isValid: result.isValid,
        messages: overrideMessage ? [overrideMessage] : result.messages,
        break: result.break || forceBreak
      });
    }

    return result;
  };
}

// reserved property names for rule object:
//   stopValidationChainIfPass, stopValidationChainIfFail, message

export default function buildValidator (rule, validatorResolve) {
  const {message,
         stopValidationChainIfPass,
         stopValidationChainIfFail} = rule || {};

  let validator;

  // console.log('buildValidator: ' + JSON.stringify(rule));

  if (_.isFunction(rule)) {
    // raw rule in function
    validator = rawValidator(rule);
  } else if (_.isArray(rule)) {
    // composition of rules
    const subRules = _.map(rule, r => buildValidator(r, validatorResolve));
    validator = validatorChain(subRules);
  } else if ((_.isString(rule) && !_.isEmpty(rule)) || _.isRegExp(rule)) {
    // try validator tranformer first
    // like we transform "mandatory" to {validate: "mandatory"}
    validator = validatorResolve(rule);

    if (!validator) {
      // wrap single expression/regex in isTrue
      validator = validatorResolve({validate: "isTrue", value: rule});
    }
  } else if (_.isPlainObject(rule)) {
    const rawRule = _.omit(rule, ['message',
                                  'stopValidationChainIfPass',
                                  'stopValidationChainIfFail']);

    validator = validatorResolve(rawRule);
  }

  if (!_.isFunction(validator)) {
    throw new Error('Unsupported rule: ' + JSON.stringify(rule));
  }

  return standardValidatorWrap(validator, {message,
                                           stopValidationChainIfPass,
                                           stopValidationChainIfFail});
};
