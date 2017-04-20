import buildValidator from './build-validator';
import {evaluate, createScope} from 'bcx-expression-evaluator';
import valueEvaluator from './value-evaluator';
import scopeVariation from './scope-variation';
import {config as configStandardValidators} from './standard-validators';
import _ from 'lodash';

const NAME_FORMAT = /^[a-z][a-z0-9_]+/i;
const NAME_FORMAT_ERROR = 'validation name must start with a letter, followed by letters, digits or underscore (_)';

class Validation {

  constructor(opts = {}) {
    this.resolveValidator = this.resolveValidator.bind(this);
    this.buildValidator = r => buildValidator(r, this.resolveValidator);
    this._validate = this._validate.bind(this);
    this.availableValidators = [];
    this.withStandardValidators();
  }

  withStandardValidators() {
    configStandardValidators(this);
  }

  resolveValidator(rule) {
    const found = _.find(this.availableValidators, v => v.test(rule));
    if (!found) return;

    const {validatorImp, transformer} = found;
    if (validatorImp) {
      // value & options can only been processed here,
      // not in buildValidator.
      // As only resolveValidator knows there the rule obj
      // is a validatorImp or transformer,
      // only validatorImp creates scope variation to
      // override $value and options.
      const validator = this.buildValidator(validatorImp);
      const value = _.get(rule, 'value', '');
      const options = _.omit(rule, ['value', 'validate']);

      let valueEval;
      try {
        valueEval = valueEvaluator(value);
      } catch (e) {}

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
            variation[`$${trueName}`] = valueEvaluator(v)(scope);
          } else {
            variation[`$${name}`] = v;
          }
        });

        if (valueEval) {
          variation.$value = valueEval(scope);
        }

        return validator(scopeVariation(scope, variation));
      };
    } else if (transformer) {
      // transformer
      const transformed = transformer(rule, this._validate);
      if (transformed.readyToUse) {
        return transformed;
      } else {
        return this.buildValidator(transformed);
      }
    } else {
      throw new Error('No transformer or validatorImp defined.');
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

    this.availableValidators.push({
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

    this.availableValidators.push({
      test: rule => evaluate(tester, rule, {_}),
      validatorImp: imp
    });
  }

  generateValidator(rulesMap, helper) {
    return model => this.validate(model, rulesMap, helper);
  }

  validate(model, rulesMap, helper = {}) {
    // use ...model to avoid scope variation to pollute model
    // add lodash to helper by default
    let bindingContext = _.isObjectLike(model) ? {...model} : {};
    _.merge(bindingContext, {$value: model, $propertyPath: ''});

    const scope = createScope(bindingContext, {_, ...helper});
    return this._validate(scope, rulesMap);
  }

  _validate(scope, rulesMap, inPropertyName) {
    let error = {};
    if (_.isEmpty(rulesMap)) return error;

    // validate the whole model without any nested property validation
    if (this.resolveValidator(rulesMap) ||
        _.isString(rulesMap) ||
        _.isRegExp(rulesMap) ||
        _.isFunction(rulesMap)) {
      rulesMap = [rulesMap];
    }

    if (_.isArray(rulesMap)) {
      const validator = this.buildValidator(rulesMap);
      const result = validator(scope);
      if (result.isValid === false) {
        return result.errors;
      }
    } else if (_.isObjectLike(rulesMap)) {
      _.each(rulesMap, (rules, propertyName) => {
        const path = inPropertyName ? `${inPropertyName}.${propertyName}` : propertyName;
        const value = valueEvaluator(path)(scope);
        const localScope = scopeVariation(scope, {
          $value: value,
          $propertyPath: path,
        });

        // try if it's a single validation
        // wrap single validation in array
        if (this.resolveValidator(rules) ||
            _.isString(rules) ||
            _.isRegExp(rules) ||
            _.isFunction(rules)) {
          rules = [rules];
        }

        if (_.isArray(rules)) {
          const validator = this.buildValidator(rules);
          const result = validator(localScope);
          if (result.isValid === false) {
            error[propertyName] = result.errors;
          }
        } else if (_.isObjectLike(rules)) {
          const nestedErrors = this._validate(scope, rules, path);

          if (!_.isEmpty(nestedErrors)) {
            error[propertyName] = nestedErrors;
          }
        } else {
          throw new Error('Unexpected rules: '+JSON.stringify(rules));
        }

      });
    }

    return error;
  }

}

export default Validation;
