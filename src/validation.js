import proxy from 'contextual-proxy';
import valueEvaluator from './value-evaluator';
import scopeVariation from './scope-variation';
import validatorChain from './validator-chain';
import standardValidatorWrap from './standard-validator-wrap';
import { config } from './standard-validators';
import canBeProxied from './can-be-proxied';

import _ from 'lodash';

const NAME_FORMAT = /^[a-z][a-z0-9_]+/i;
const NAME_FORMAT_ERROR = 'validation name must start with a letter, followed by letters, digits or underscore (_)';
const PASSED = standardValidatorWrap(() => undefined);

function addTransformer(tester, transformer) {
  let testFunc;
  if (_.isFunction(tester)) {
    testFunc = tester;
  } else {
    throw new Error('Invalid transformer tester: ' + tester);
  }

  this._transformers.push({
    test: testFunc,
    transformer
  });
}

function addValidator(validationName, imp) {
    const name = _.trim(validationName);
  if (_.isEmpty(name)) throw new Error("Missing validation name.");

  if (!NAME_FORMAT.test(name)) {
    throw new Error(`${name} : ${NAME_FORMAT_ERROR}`);
  }

  const tester = r => _.get(r, 'validate') === name;

  this._validators[name] = imp;
}

function addHelper(name, helper) {
  if (_.isString(name) && !_.isEmpty(name)) {
    this._helpers[name] = helper;
  }
}

class Validation {
  constructor(opts = {}) {
    this.resolveValidator = this.resolveValidator.bind(this);
    this._validate = this._validate.bind(this);

    this._transformers = [];
    this._validators = {};
    this._helpers = {};

    this.addTransformer = addTransformer;
    this.addValidator = addValidator;
    this.addHelper = addHelper;
  }

  get transformers() {
    return [...Validation._transformers, ...this._transformers];
  }

  get validators() {
    return {...Validation._validators, ...this._validators, };
  }

  get helpers() {
    return {...Validation._helpers, ...this._helpers};
  }

  buildValidator(rule, inPropertyName) {
    const {message,
         stopValidationChainIfPass,
         stopValidationChainIfFail} = rule || {};

    let validator;

    if (_.isFunction(rule)) {
      // raw rule in function
      validator = valueEvaluator(rule);
    } else if ((_.isString(rule) && !_.isEmpty(rule)) || _.isRegExp(rule)) {
      // try validator transformer first
      // like we transform "mandatory" to {validate: "mandatory"}
      validator = this.resolveValidator(rule, inPropertyName);

      if (!validator) {
        // wrap single expression/regex in isTrue
        validator = this.resolveValidator({validate: "isTrue", value: rule}, inPropertyName);
      }
    } else if (_.isObjectLike(rule)) {
      const rawRule = _.omit(rule, ['message',
                                    'stopValidationChainIfPass',
                                    'stopValidationChainIfFail']);

      validator = this.resolveValidator(rawRule, inPropertyName);
    }

    if (!_.isFunction(validator) &&
        !(validator && validator.$validator && validator.$patchScope)) {
      // Unsupported rule
      return;
    }

    return standardValidatorWrap(validator, {message,
                                             stopValidationChainIfPass,
                                             stopValidationChainIfFail});
  }

  resolveValidator(rule, inPropertyName) {
    const validators = this.validators;
    const isAlias = _.isString(rule);

    const _transformer = !isAlias && _.find(this.transformers, v => v.test(rule));
    let _validator = isAlias && validators[rule];

    if (_transformer) {
      // transformer
      const transformed = _transformer.transformer(rule, this._validate, inPropertyName);
      if (transformed.readyToUse) {
        return transformed;
      } else {
        return this._validate(transformed, inPropertyName);
      }
    } else if (!_validator) {
      const name = _.get(rule, 'validate');
      if (_.isString(name)) _validator = validators[name];
    }

    if (_validator) {
      // value & options can only been processed here,
      // As only resolveValidator knows there the rule obj
      // is a validator or transformer,
      // only validator creates scope variation to
      // override $value and options.
      const validator = this._validate(_validator, inPropertyName);
      if (isAlias) return validator;

      const value = _.get(rule, 'value');
      const options = _.omit(rule, ['value', 'validate']);

      let valueEval = valueEvaluator(value);

      if (!valueEval && _.isEmpty(options)) {
        return validator;
      }

      // otherwise, override scope with value and options
      const patchScope = scope => {
        let variation = {};
        // prefix option name with $ in scope to reduce chance of conflict

        // load static options first
        _.forOwn(options, (v, name) => {
          if (_.endsWith(name, '.bind')) return;
          variation[`$${name}`] = v;
        });

        // Then load runtime options
        const withStaticOptions = scopeVariation(scope, variation);
        _.forOwn(options, (v, name) => {
          if (_.endsWith(name, '.bind')) {
            // support binding on option like "maxLength.bind":...
            const trueName = name.slice(0, -5);
            const optionEval = valueEvaluator(v);
            variation[`$${trueName}`] = optionEval(withStaticOptions);
          }
        });

        if (valueEval) {
          variation.$value = valueEval(scopeVariation(scope, variation));
        }

        return scopeVariation(scope, variation);
      };

      // let standardValidatorWrap to deal with scope variation
      return {$validator: validator, $patchScope: patchScope};
    }
  }

  generateValidator(rulesMap, helper) {
    const compiled = this._validate(rulesMap);
    return model => {
      const scope = this._buildScope(model, helper);
      return compiled(scope).errors;
    };
  }

  _buildScope(model, helper = {}) {
    return proxy(
      canBeProxied(model) ? model : {},
      { ...Validation.sharedHelpers, ...this.helpers, ...helper },
      // initial $value and $propertyPath
      { $value: model, $propertyPath: null }
    );
  }

  validate(model, rulesMap, helper = {}) {
    const scope = this._buildScope(model, helper);
    const result = this._validate(rulesMap)(scope);
    return result.errors;
  }

  _validate(rulesMap, inPropertyName) {
    if (_.isUndefined(rulesMap) || _.isNull(rulesMap)) return PASSED;

    // try validate the whole model without any nested property validation
    const validator = this.buildValidator(rulesMap, inPropertyName);

    if (validator) return validator;

    // try other
    if (_.isArray(rulesMap)) {
      // composition of rules
      const subRules = _.map(rulesMap, r => this._validate(r, inPropertyName));
      return standardValidatorWrap(validatorChain(subRules));

    } else if (_.isObjectLike(rulesMap)) {
      // nested rules
      const precompiled = _.mapValues(rulesMap, (rules, propertyName) => {
        const path = inPropertyName ? [...inPropertyName, propertyName] : [propertyName];
        return this._validate(rules, path);
      });

      return standardValidatorWrap(scope => {
        const errors = {};
        _.each(rulesMap, (rules, propertyName) => {
          const path = inPropertyName ? [...inPropertyName, propertyName] : [propertyName];

          const value = _.get(scope.$this, path);
          const neighbourValues = _.map(scope.$neighbours, _.property(path));
          const localScope = scopeVariation(scope, {
            $value: value,
            $propertyPath: path,
            $neighbourValues: neighbourValues
          });

          const result = precompiled[propertyName](localScope);

          if (result.isValid === false) {
            errors[propertyName] = result.errors;
          }
        });

        return {isValid: _.isEmpty(errors), errors};
      });

    } else {
      throw new Error('Unexpected rules: ' + JSON.stringify(rulesMap));
    }
  }

}

Validation._helpers = {};
Validation.addHelper = addHelper;
Validation._transformers = [];
Validation.addTransformer = addTransformer;
Validation._validators = {};
Validation.addValidator = addValidator;

// Add standard validators as globals
config(Validation);
// Add lodash to helper by default
Validation.addHelper('_', _);
Validation.addHelper('JSON', JSON);

export default Validation;
