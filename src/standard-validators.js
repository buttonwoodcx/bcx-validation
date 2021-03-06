import _ from 'lodash';
import proxy from 'contextual-proxy';
import valueEvaluator from './value-evaluator';
import canBeProxied from './can-be-proxied';

export function isBlank(v) {
  if (_.isNull(v) || _.isUndefined(v) || _.isNaN(v)) return true;
  if (_.isString(v)) {
    if (_.trim(v).length === 0) return true;
  } else if (_.isArray(v) || _.isPlainObject(v)) {
    if (_.isEmpty(v)) return true;
  }
}

export const ifTester = function (rule) {
  if (!_.has(rule, 'if')) return false;
  return _.isString(rule.if) && !_.isEmpty(_.omit(rule, 'if'));
};

export const ifTransformer = function (rule) {
  const _if = _.get(rule, 'if');
  const subRule = _.omit(rule, 'if');
  const options = _.omit(subRule, 'group', 'validate', 'value', 'message');

  let rules = [];
  // if condition is false, skip the real validation
  rules.push({validate: "skipImmediatelyIf", value: `!(${_if})`, ...options});

  if (_.has(subRule, 'group') &&
      _.isArray(subRule.group)) {
    rules.push(... subRule.group);
  } else {
    rules.push(subRule);
  }

  return rules;
};

export const switchTester = function (rule) {
  if (!_.has(rule, 'switch')) return false;
  if (!_.has(rule, 'cases')) return false;
  if (!_.isEmpty(_.omit(rule, ['switch', 'cases', 'default']))) return false;
  return (_.isString(rule.switch) || _.isFunction(rule.switch)) &&
    _.isObjectLike(rule.cases);
};

export const switchTransformer = function (rule, validate, inPropertyName) {
  const _switch = _.get(rule, 'switch');
  const cases = _.get(rule, 'cases');
  const _default = _.get(rule, 'default');
  const switchEvaluator = valueEvaluator(_switch);

  const precompiledPlain = _.mapValues(cases, rules => validate(rules));
  const precompiledNested = _.mapValues(cases, rules => validate(rules, inPropertyName));
  const precompiledPlainDefault = _default && validate(_default);
  const precompiledNestedDefault = _default && validate(_default, inPropertyName);

  const validator = scope => {
    // make a guess whether user try to use nested validation or plain validation
    const value = scope.$value;
    let precompiled, precompiledDefault;

    if (_.isObjectLike(value)) {
      // in nested object
      const newScope = proxy(value, scope, {$value: value});
      precompiled = precompiledNested[switchEvaluator(newScope)];
      precompiledDefault = precompiledNestedDefault;
    } else {
      // normal switch
      precompiled = precompiledPlain[switchEvaluator(scope)];
      precompiledDefault = precompiledPlainDefault;
    }

    if (precompiled) {
      return precompiled(scope);
    } else if (precompiledDefault) {
      return precompiledDefault(scope);
    }
  };

  validator.readyToUse = true;
  return validator;
};

export const forEachTester = function (rule) {
  if (!_.has(rule, 'foreach')) return false;
  if (!_.isEmpty(_.omit(rule, ['foreach', 'key']))) return false;
  if (rule.key && !_.isString(rule.key) && !_.isFunction(rule.key)) return false;
  return true;
};

export const forEachTransformer = function (rule, validate /*, inPropertyName*/) {
  const foreachRulesMap = _.get(rule, 'foreach');
  let foreachRulesMapFunc;
  if (_.isFunction(foreachRulesMap)) {
    foreachRulesMapFunc = valueEvaluator(foreachRulesMap);
  } else if (_.isArray(foreachRulesMap) && _.some(foreachRulesMap, _.isFunction)) {
    foreachRulesMapFunc = scope => _.map(foreachRulesMap, r =>
      _.isFunction(r) ? valueEvaluator(r)(scope) : r
    );
  }

  // don't pass inPropertyName to underneath validators,
  // they work in new scope with propertyPath null.
  const precompiled = !foreachRulesMapFunc && validate(foreachRulesMap);

  const _key = _.get(rule, 'key', '$index');
  const keyEvaluator = valueEvaluator(_key);

  const validator = scope => {
    const errors = {};
    const enumerable = scope.$value;
    const length = _.size(enumerable);
    _.each(enumerable, (item, index) => {
      const neighbours = _.filter(enumerable, (v, i) => i !== index);
      const newScope = proxy(canBeProxied(item) ? item : {}, scope, {
        $value: item,
        $propertyPath: null, // initial propertyPath
        $neighbours: neighbours,
        $neighbourValues: neighbours,
        $index: index,
        $first: index === 0,
        $last: (index === length - 1),
      });

      const key = keyEvaluator(newScope);
      const result = (precompiled || validate(foreachRulesMapFunc(newScope)))(newScope);

      if (result.isValid === false) {
        errors[key] = result.errors;
      }
    });

    return {isValid: _.isEmpty(errors), errors};
  };

  validator.readyToUse = true;
  return validator;
};

export function config (validation) {

// Transformers

  // The order of transformers and validators is very important.
  // It is the order that resolveValidator finds a match.

  // if a rule contains {if: 'expression'}
  // transform it into a chain of validators
  // support two forms:
  //
  // group form:
  //   {if: 'expression', group: [ /* validators */]}
  //
  // single form:
  //   {if: 'expression', validate: 'name', ...}
  //
  validation.addTransformer(ifTester, ifTransformer);

  // switch
  //
  // on single field:
  //   {
  //     switch: 'expression',
  //     cases: {
  //       "matchingA": {validate: 'name', ...},
  //       "matchingB": [ /* validators */ ]
  //     }
  //   }
  //
  // on nested object:
  //   {
  //     switch: 'expression',
  //     cases: {
  //       "matchingA": {field1: {validate: 'name', ...}, field2: [ /* validators */ ],
  //       "matchingB": {/*...*/}
  //     }
  //   }
  //
  validation.addTransformer(switchTester, switchTransformer);

  // foreach
  //
  // {
  //   foreach: ...rules,
  //   key: optional key expression or function
  // }
  //
  validation.addTransformer(forEachTester, forEachTransformer);

  // transform regex
  validation.addTransformer(
    _.isRegExp,
    rule => ({validate: "isTrue", value: rule, message: 'invalid format'})
  );

  validation.addTransformer(
    r => _.isRegExp(r && r.validate),
    rule => ({validate: "isTrue", value: rule.validate, message: 'invalid format'})
  );


// Validators

  // validators implemented in functions.

  validation.addValidator("isTrue", v => v ? null : "must be true");
  validation.addValidator("isFalse", v => v ? "must be false" : null);

  validation.addValidator(
    "passImmediatelyIf",
    v => v ?
    // stop the chain if passed
    {isValid: true, break: true} :
    // continue, never fail
    null
  );

  validation.addValidator(
    "skipImmediatelyIf",
    v => v ?
    // skip rest if passed
    // isValid is not true, but null
    {isValid: null, break: true} :
    // continue, never fail
    null
  );

  validation.addValidator(
    "failImmediatelyIf",
    v => v ?
    // stop the chain if failed
    {isValid: false, break: true} :
    // continue
    null
  );

  // all other validators are in form of composition.

  validation.addValidator("isBlank", {validate: "isTrue", value: isBlank, message: "must be blank"});
  validation.addValidator("notBlank", {validate: "isFalse", value: isBlank, message: "must not be blank"});

  validation.addValidator("mandatory", {validate: "failImmediatelyIf", value: isBlank, message: "must not be empty"});
  validation.addValidator("notMandatory", {validate: "skipImmediatelyIf", value: isBlank});

  // {validate: 'number', integer: true, min: 0, max: 10, greaterThan: 0, lessThan: 10, even: true, /* odd: true */}
  validation.addValidator("number", [
    {validate: "isTrue", value: v => _.isNumber(v), message: "must be a number", stopValidationChainIfFail: true},
    // option {integer: true}
    {if: "$integer", validate: "isTrue", value: v => _.isInteger(v), message: "must be an integer", stopValidationChainIfFail: true},
    // option {min: aNumber}
    {if: "_.isNumber($min)", validate: "isTrue", value: "$value >= $min", message: "must be at least ${$min}"},
    // option {greaterThan: aNumber}
    {if: "_.isNumber($greaterThan)", validate: "isTrue", value: "$value > $greaterThan", message: "must be greater than ${$greaterThan}"},
    // option {max: aNumber}
    {if: "_.isNumber($max)", validate: "isTrue", value: "$value <= $max", message: "must be no more than ${$max}"},
    // option {lessThan: aNumber}
    {if: "_.isNumber($lessThan)", validate: "isTrue", value: "$value < $lessThan", message: "must be less than ${$lessThan}"},
    // option {even: true}
    {if: "$even", validate: "isTrue", value: v => v % 2 === 0, message: "must be an even number"},
    // option {odd: true}
    {if: "$odd", validate: "isTrue", value: v => v % 2 === 1, message: "must be an odd number"}
  ]);

  // {validate: 'string', minLength: 4, maxLength: 8}
  validation.addValidator("string", [
    {validate: "isTrue", value: v => _.isString(v), message: "must be a string", stopValidationChainIfFail: true},
    {if: "$minLength", validate: "isTrue", value: "_.size($value) >= $minLength", message: "must have at least ${$minLength} characters"},
    {if: "$maxLength", validate: "isTrue", value: "_.size($value) <= $maxLength", message: "must be no more than ${$maxLength} characters"}
  ]);

  // {validate: 'within', items: [ ... ], caseInsensitive: true}
  validation.addValidator("within", [
    {if: "!$caseInsensitive", validate: "isTrue", value: "_.differenceWith([$value], $items, _.isEqual).length === 0", message: "must be one of ${_.join(_.map($items, JSON.stringify), ', ')}"},
    {if: "$caseInsensitive", validate: "isTrue", value: "_.includes(_.map($items, _.toLower), _.toLower($value))", message: "must be one of ${_.join(_.map($items, JSON.stringify), ', ')}"},
  ]);

  // {validate: 'notIn', items: [ ... ], caseInsensitive: true}
  validation.addValidator("notIn", [
    {if: "!$caseInsensitive", validate: "isFalse", value: "_.differenceWith([$value], $items, _.isEqual).length === 0", message: "must not be one of ${_.join(_.map($items, JSON.stringify), ', ')}"},
    {if: "$caseInsensitive", validate: "isFalse", value: "_.includes(_.map($items, _.toLower), _.toLower($value))", message: "must not be one of ${_.join(_.map($items, JSON.stringify), ', ')}"},
  ]);

  // {validate: 'contain', item: obj, /* or items: [...] */}
  validation.addValidator("contain", [
    {if: "$item", validate: "isTrue", value: "_.includes($value, $item)", message: "must contain ${$item}"},
    {if: "$items", validate: "isBlank", value: "_.difference($items, $value)", message: "missing ${_.difference($items, $value).join(', ')}"},
  ]);

  // {validate: 'password', minLength: 4, maxLength: 8, alphabet: true, mixCase: true, digit: true, specialChar: true}
  validation.addValidator("password", [
    // min/maxLength options would be passed through in scope, do not need explicit passing to string validator
    {validate: 'string'},
    {if: '$alphabet', validate: "isTrue", value: /[a-z]/i, message: 'must contain alphabet letter'},
    {if: '$mixCase', group: [{validate: "isTrue", value: /[a-z]/}, {validate: "isTrue", value: /[A-Z]/}], message: 'must contain both lower case and upper case letters'},
    {if: '$digit', validate: /[0-9]/, message: 'must contain number'},
    {if: '$specialChar', validate: /[!@#$%^&*()\-_=+\[\]{}\\|;:'",<.>\/?]/, message: 'must contain special character (like !@$%)'},
  ]);

  // email regex from https://html.spec.whatwg.org/multipage/forms.html#valid-e-mail-address
  // updated to block Intranet email address user@server1 as it's rarely used nowadays
  validation.addValidator("email", {validate: "isTrue", value: /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/,
             message: "not a valid email"});

  // unique. need to access neighbours
  // option items is evaluated from current scope
  validation.addValidator("unique", {validate: "notIn", "items.bind": "$neighbourValues", message: "must be unique"});

  // url, only http and https are supported
  // regex based on https://www.ietf.org/rfc/rfc3986.txt
  // but limited to just http and https protocol
  validation.addValidator("url", [
    {validate: "isFalse", value: /\s/, message: 'not a valid URL, white space must be escaped'},
    {validate: "isTrue", value: /^https?:\/\/[^/?#]+[^?#]*(\?[^#]*)?(#.*)?$/, message: 'not a valid URL'}
  ]);
}
