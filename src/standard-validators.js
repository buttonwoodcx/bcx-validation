import _ from 'lodash';
import {createSimpleScope, createOverrideContext} from 'bcx-expression-evaluator';
import valueEvaluator from './value-evaluator';

export function isBlank(v) {
  if (_.isNull(v) || _.isUndefined(v) || _.isNaN(v)) return true;
  if (_.isString(v)) {
    if (_.trim(v).length === 0) return true;
  } else if (_.isNumber(v)) {
    return false;
  } else if (_.isArray(v) || _.isPlainObject(v)) {
    if (_.isEmpty(v)) return true;
  }
}

export const ifTransformer = function (rule) {
  const _if = _.get(rule, 'if');
  const subRule = _.omit(rule, 'if');

  let rules = [];
  // if condition is false, skip the real validation
  rules.push({validate: "skipImmediatelyIf", value: `!(${_if})`});

  if (_.has(subRule, 'group') &&
      _.isArray(subRule.group)) {
    rules.push(... subRule.group);
  } else {
    rules.push(subRule);
  }

  return rules;
};

// TODO: do we need to support switch: a_function?
export const switchTransformer = function (rule, validate) {
  const _switch = _.get(rule, 'switch');
  const cases = _.get(rule, 'cases');

  const validator = scope => {
    // make a guess whether user try to use nested validation or plain validation
    let nestedPath;
    if (_.isObjectLike(valueEvaluator('$value')(scope))) {
      nestedPath = valueEvaluator('$propertyPath')(scope);
      // console.log(' nestedPath:'+nestedPath);
    }

    const switchEvaluator = valueEvaluator(nestedPath ? `${nestedPath}.${_switch}` : _switch);

    const _case = switchEvaluator(scope);
    const matchCase = cases[_case];
    // console.log('  case: '+_case);
    // console.log('  matchCase: '+JSON.stringify(matchCase));
    // console.log('  scope: ' + JSON.stringify(scope, null, 2));
    if (!matchCase) return;

    const errors = validate(scope, matchCase, nestedPath);
    if (!_.isEmpty(errors)) {
      // console.log('errors:'+JSON.stringify(errors));
      return {isValid: false, errors: errors};
    }
  };

  validator.readyToUse = true;
  return validator;
};

export const forEachTester = function (rule) {
  if (!_.has(rule, 'foreach')) return;
  if (!_.isEmpty(_.omit(rule, ['foreach', 'key']))) return;
  return true;
};

export const forEachTransformer = function (rule, validate) {
  const foreachRulesMap = _.get(rule, 'foreach');
  let foreachRulesMapFunc;
  if (_.isFunction(foreachRulesMap)) {
    foreachRulesMapFunc = valueEvaluator(foreachRulesMap);
  }

  const _key = _.get(rule, 'key', '$index');
  const keyEvaluator = valueEvaluator(_key);

  const validator = scope => {
    let result = {};
    const enumerable = valueEvaluator('$value')(scope);
    const length = _.size(enumerable);
    _.each(enumerable, (item, index) => {
      const {overrideContext} = scope;
      let newOverrideContext = createOverrideContext(item, overrideContext);

      let neighbours = _.filter(enumerable, (v, i) => i !== index);

      _.merge(newOverrideContext, {
        $value: item,
        $propertyPath: '', // initial propertyPath
        $neighbours: neighbours,
        $index: index,
        $first: index === 0,
        $last: (index === length - 1),
      });

      const newScope = {
        bindingContext: item,
        overrideContext: newOverrideContext
      };

      const key = keyEvaluator(newScope);
      const errors = validate(newScope, foreachRulesMapFunc ?
                                        foreachRulesMapFunc(newScope) :
                                        foreachRulesMap);

      if (!_.isEmpty(errors)) {
        result[key] = errors;
      }
    });

    if (!_.isEmpty(result)) {
      return {isValid: false, errors: result};
    }
  };

  validator.readyToUse = true;
  return validator;
};

// The order of transformers and validators is very important.
// It is the order that resolveValidator finds a match.
export const standardTransformers = [

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
  // note: 'if' is a reserved word in javascript but not in bcx-expression
  // be less surprising but verbose, write "_.isString($this['if'])"
  ["_.isString(if) && !_.isEmpty(_.omit($this, 'if'))", ifTransformer],

  // switch
  //
  // {
  //   switch: 'expression',
  //   cases: {
  //     "matchingA": {validate: 'name', ...},
  //     "matchingB": [ /* validators */ ]
  //   }
  // }
  //
  // note: 'switch' is a reserved word in javascript but not in bcx-expression
  // be less surprising but verbose, write "_.isString($this['switch'])"
  ["_.isString(switch) && _.isObjectLike(cases) && _.isEmpty(_.omit($this, 'switch', 'cases'))", switchTransformer],

  // foreach
  //
  // {
  //   foreach: ...rules,
  //   key: optional key expression or function
  // }
  //
  [forEachTester, forEachTransformer],

  // transform regex
  ["_.isRegExp($this)", rule => ({validate: "isTrue", value: rule})],
  ["_.isRegExp(validate)", rule => ({validate: "isTrue", value: rule.validate})],

  // transform "isBlank"
  ["$this === 'isBlank'", () => ({validate: "isBlank"})],

  // transform "notBlank"
  ["$this === 'notBlank'", () => ({validate: "notBlank"})],

  // transform "mandatory"
  ["$this === 'mandatory'", () => ({validate: "mandatory"})],

  // transform "notMandatory"
  ["$this === 'notMandatory'", () => ({validate: "notMandatory"})],

  // transform "email"
  ["$this === 'email'", () => ({validate: "email"})],

  // transform "unique"
  ["$this === 'unique'", () => ({validate: "unique"})],
];

export const standardValidators = [
  //validators implemented in func
  ["isTrue", v => v ? null : "must be true"],

  ["passImmediatelyIf", v => v ?
                             // stop the chain if passed
                             {isValid: true, break: true} :
                             // continue, never fail
                             null],

  ["skipImmediatelyIf", v => v ?
                             // skip rest if passed
                             // isValid is not true, but null
                             {isValid: null, break: true} :
                             // continue, never fail
                             null],

  ["failImmediatelyIf", v => v ?
                             // stop the chain if failed
                             {isValid: false, break: true} :
                             // continue
                             null],


  // all other validators are in form of rewrite or composition
  ["isFalse", {validate: "isTrue", value: "!$value", message: "must be false"}],
  ["isBlank", {validate: "isTrue", value: isBlank, message: "must be blank"}],
  ["notBlank", {validate: "isFalse", value: isBlank, message: "must not be blank"}],

  ["mandatory", {validate: "failImmediatelyIf", value: isBlank, message: "must not be empty"}],
  ["notMandatory", {validate: "skipImmediatelyIf", value: isBlank}],

  // {validate: 'number', integer: true, min: 0, max: 10, greaterThan: 0, lessThan: 10, even: true, /* odd: true */}
  ["number", [
    {validate: "isTrue", value: "_.isNumber($value)", message: "must be a number", stopValidationChainIfFail: true},
    // option {integer: true}
    {if: "$integer", validate: "isTrue", value: "_.isInteger($value)", message: "must be an integer", stopValidationChainIfFail: true},
    // option {min: aNumber}
    {if: "_.isNumber($min)", validate: "isTrue", value: "$value >= $min", message: "must be at least ${$min}"},
    // option {greaterThan: aNumber}
    {if: "_.isNumber($greaterThan)", validate: "isTrue", value: "$value > $greaterThan", message: "must be greater than ${$greaterThan}"},
    // option {max: aNumber}
    {if: "_.isNumber($max)", validate: "isTrue", value: "$value <= $max", message: "must be no more than ${$max}"},
    // option {lessThan: aNumber}
    {if: "_.isNumber($lessThan)", validate: "isTrue", value: "$value < $lessThan", message: "must be less than ${$lessThan}"},
    // option {even: true}
    {if: "$even", validate: "isTrue", value: "$value % 2 === 0", message: "must be an even number"},
    // option {odd: true}
    {if: "$odd", validate: "isTrue", value: "$value % 2 === 1", message: "must be an odd number"}
  ]],

  // {validate: 'string', minLength: 4, maxLength: 8}
  ["string", [
    {validate: "isTrue", value: "_.isString($value)", message: "must be a string", stopValidationChainIfFail: true},
    {if: "$minLength", validate: "isTrue", value: "_.size($value) >= $minLength", message: "must have at least ${$minLength} characters"},
    {if: "$maxLength", validate: "isTrue", value: "_.size($value) <= $maxLength", message: "must be no more than ${$maxLength} characters"}
  ]],

  // {validate: 'within', items: [ ... ]}
  ["within", {validate: "isTrue", value: "_.includes($items, $value)", message: "must be one of ${_.join($items, ', ')}"}],

  // {validate: 'notIn', items: [ ... ]}
  ["notIn", {validate: "isFalse", value: "_.includes($items, $value)", message: "must not be one of ${_.join($items, ', ')}"}],

  // {validate: 'contain', item: obj, /* or items: [...] */}
  ["contain", [
    {if: "$item", validate: "isTrue", value: "_.includes($value, $item)", message: "must contain ${$item}"},
    {if: "$items", validate: "isBlank", value: "_.difference($items, $value)", message: "missing ${_.difference($items, $value).join(', ')}"},
  ]],

  // {validate: 'password', minLength: 4, maxLength: 8, alphabet: true, mixCase: true, digit: true, specialChar: true}
  ["password", [
    // min/maxLength options would be passed through in scope, do not need explicit passing to string validator
    {validate: 'string'},
    // {validate: /[a-z]/i} is a shortcut to
    // {validate: "isTrue", value: /[a-z]/i}
    {if: '$alphabet', validate: /[a-z]/i, message: 'must contain alphabet letter'},
    // [/[a-z]/, /[A-Z]/] is a shortcut to
    // [
    //   {validate: "isTrue", value: /[a-z]/},
    //   {validate: "isTrue", value: /[A-Z]/}
    // ]
    {if: '$mixCase', group: [/[a-z]/, /[A-Z]/], message: 'must contain both lower case and upper case letters'},
    {if: '$digit', validate: /[0-9]/, message: 'must contain number'},
    {if: '$specialChar', validate: /[!@#$%^&*()\-_=+\[\]{}\\|;:'",<.>\/?]/, message: 'must contain special character (like !@$%)'},
  ]],

  // email regex from https://html.spec.whatwg.org/multipage/forms.html#valid-e-mail-address
  ["email", {validate: /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/,
             message: "not a valid email"}],

  // unique. need to access neighbours
  // option items is evaluated from current scope
  // neighbours could be simple value (when no propertyPath)
  ["unique", {validate: "notIn", "items.bind": "$propertyPath ? _.map($neighbours, $propertyPath) : $neighbours", message: "must be unique"}],
];

export function config (validation) {
  _.each(standardTransformers, pair => {
    const [tester, transformer] = pair;
    validation.addTransformer(tester, transformer);
  });

  _.each(standardValidators, pair => {
    const [name, imp] = pair;
    validation.addValidator(name, imp);
  });
}
