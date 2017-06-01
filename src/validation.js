import {evaluate, createSimpleScope} from 'bcx-expression-evaluator';
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
    this._validators = [];

    this.standardHelpers = {};
    this.withStandardValidators();
    // add lodash to helper by default
    this.addHelper('_', _);
  }

  withStandardValidators() {
    configStandardValidators(this);
  }

  buildValidator(rule) {
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
      validator = this.resolveValidator(rule);

      if (!validator) {
        // wrap single expression/regex in isTrue
        validator = this.resolveValidator({validate: "isTrue", value: rule});
      }
    } else if (_.isObjectLike(rule)) {
      const rawRule = _.omit(rule, ['message',
                                    'stopValidationChainIfPass',
                                    'stopValidationChainIfFail']);

      validator = this.resolveValidator(rawRule);
    }

    if (!_.isFunction(validator)) {
      // Unsupported rule
      return;
    }

    return standardValidatorWrap(validator, {message,
                                             stopValidationChainIfPass,
                                             stopValidationChainIfFail});
  }

  resolveValidator(rule) {
    const _transformer = _.find(this._transformers, v => v.test(rule));
    const _validator = _.find(this._validators, v => v.test(rule));

    if (_transformer) {
      // transformer
      const transformed = _transformer.transformer(rule, this._validate);
      if (transformed.readyToUse) {
        return transformed;
      } else {
        return this._validate(transformed);
      }
    } else if (_validator) {
      // value & options can only been processed here,
      // As only resolveValidator knows there the rule obj
      // is a validatorImp or transformer,
      // only validatorImp creates scope variation to
      // override $value and options.
      const validator = this._validate(_validator.validatorImp);
      const value = _.get(rule, 'value');
      const options = _.omit(rule, ['value', 'validate']);

      let valueEval = valueEvaluator(value);

      if (!valueEval && _.isEmpty(options)) {
        return validator;
      }

      // otherwise, override scope with value and options
      return scope => {
        let variation = {};
        // prefix option name with $ in scope to reduce chance of conflict
        _.each(options, (v, name) => {
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
          variation.$value = valueEval(scope);
        }

        return validator(scopeVariation(scope, variation));
      };

    } else {
      // ignore
    }
  }

  addTransformer(tester, transformer) {
    let testFunc;
    if (_.isFunction(tester)) {
      testFunc = tester;
    } else if (_.isString(tester)) {
      testFunc = rule => evaluate(tester, rule, {_});
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

    const tester = `validate === '${name}'`;

    this._validators.push({
      test: rule => evaluate(tester, rule, {_}),
      validatorImp: imp
    });
  }

  addHelper(name, helper) {
    if (_.isString(name) && !_.isEmpty(name)) {
      this.standardHelpers[name] = helper;
    }
  }

  generateValidator(rulesMap, helper) {
    return model => this.validate(model, rulesMap, helper);
  }

  validate(model, rulesMap, helper = {}) {
    let scope = createSimpleScope(model, {...this.standardHelpers, ...helper});
    // initial $value and $propertyPath
    _.merge(scope.overrideContext, {$value: model, $propertyPath: ''});

    const result = this._validate(rulesMap)(scope);
    return result.errors;
  }

  _validate(rulesMap, inPropertyName) {
    if (_.isUndefined(rulesMap) || _.isNull(rulesMap)) return PASSED;

    // try validate the whole model without any nested property validation
    const validator = this.buildValidator(rulesMap);

    if (validator) return validator;

    // try other
    if (_.isArray(rulesMap)) {
      // composition of rules
      const subRules = _.map(rulesMap, r => this._validate(r, inPropertyName));
      return standardValidatorWrap(validatorChain(subRules));

    } else if (_.isObjectLike(rulesMap)) {
      // nested rules
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

          const result = this._validate(rules, path)(localScope);

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
