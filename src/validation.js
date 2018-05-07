import {createSimpleScope} from 'bcx-expression-evaluator';
import valueEvaluator from './value-evaluator';
import scopeVariation from './scope-variation';
import validatorChain from './validator-chain';
import standardValidatorWrap from './standard-validator-wrap';
import {config as configStandardValidators} from './standard-validators';
import _ from 'lodash';

const NAME_FORMAT = /^[a-z][a-z0-9_]+/i;
const NAME_FORMAT_ERROR = 'validation name must start with a letter, followed by letters, digits or underscore (_)';
const PASSED = standardValidatorWrap(() => undefined);

class Validation {

  constructor(opts = {}) {
    this.resolveValidator = this.resolveValidator.bind(this);
    this._validate = this._validate.bind(this);

    this._transformers = [];
    this._validators = {};

    this.standardHelpers = {};
    this.withStandardValidators();
    // add lodash to helper by default
    this.addHelper('_', _);
  }

  withStandardValidators() {
    configStandardValidators(this);
  }

  buildValidator(rule, inPropertyName) {
    let id = Math.random();
    const {message,
         stopValidationChainIfPass,
         stopValidationChainIfFail} = rule || {};

    let validator;

    if (_.isFunction(rule)) {
      // raw rule in function
      validator = valueEvaluator(rule);
    } else if ((_.isString(rule) && !_.isEmpty(rule)) || _.isRegExp(rule)) {
      // try validator tranformer first
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
    const isAlias = _.isString(rule);

    const _transformer = !isAlias && _.find(this._transformers, v => v.test(rule));
    let _validator = isAlias && this._validators[rule];

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
      if (_.isString(name)) _validator = this._validators[name];
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

        _.forOwn(options, (v, name) => {
          if (_.endsWith(name, '.bind')) {
            // support binding on option like "maxLength.bind":...
            const trueName = name.substr(0, name.length - 5);
            const optionEval = valueEvaluator(v);
            variation[`$${trueName}`] = optionEval && optionEval(scope) || v;
          } else {
            variation[`$${name}`] = v;
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

  addTransformer(tester, transformer) {
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

  addValidator(validationName, imp) {
    const name = _.trim(validationName);
    if (_.isEmpty(name)) throw new Error("Missing validation name.");

    if (!NAME_FORMAT.test(name)) {
      throw new Error(`${name} : ${NAME_FORMAT_ERROR}`);
    }

    const tester = r => _.get(r, 'validate') === name;

    this._validators[name] = imp;
  }

  addHelper(name, helper) {
    if (_.isString(name) && !_.isEmpty(name)) {
      this.standardHelpers[name] = helper;
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
    let scope = createSimpleScope(model, {...this.standardHelpers, ...helper});
    // initial $value and $propertyPath
    _.merge(scope.overrideContext, {$value: model, $propertyPath: null});
    return scope;
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

          const value = _.get(valueEvaluator('$this')(scope), path);
          const neighbourValues = _.map(valueEvaluator('$neighbours')(scope), _.property(path));
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

export default Validation;
