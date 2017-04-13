import _ from 'lodash';

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

export const standardTransformers = [

  // transform regex
  ["_.isRegExp($this)", rule => ({validate: "isTrue", value: rule})],
  ["_.isRegExp(validate)", rule => ({validate: "isTrue", value: rule.validate})],

  // transform "mandatory"
  ["$this === 'mandatory'", () => ({validate: "mandatory"})],

  // transform "notMandatory"
  ["$this === 'notMandatory'", () => ({validate: "notMandatory"})],

  // if a rule contains {if: anExpression}
  // transform it into a chain of validators
  ["_.isString(if)", rule => {
    const _if = _.get(rule, 'if');
    const subRule = _.omit(rule, 'if');

    return [
      {validate: "passImmediatelyIf", value: `!(${_if})`},
      subRule
    ];
  }],

  // TODO switch

  // TODO foreach
];

export const standardValidators = [
  //validators implemented in func
  ["isTrue", v => v ? null : "must be true"],

  ["passImmediatelyIf", v => v ?
                             // stop the chain if passed
                             {isValid: true, break: true} :
                             // continue, never fail
                             null],

  ["failImmediatelyIf", v => v ?
                             // stop the chain if failed
                             {isValid: false, break: true} :
                             // continue
                             null],


  // all other validators are in form of rewrite or composition
  ["isFalse", {validate: "isTrue", value: "!$value", message: "must be false"}],

  ["mandatory", {validate: "failImmediatelyIf", value: isBlank, message: "must not be empty"}],
  ["notMandatory", {validate: "passImmediatelyIf", value: isBlank}],

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
  ]]
];
