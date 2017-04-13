import buildValidator from './build-validator';
import {evaluate, createOverrideContext, createSimpleScope} from 'bcx-expression-evaluator';
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

    this.availableValidators = [];

    if (!opts.withoutStandardValidators) {
      this.withStandardValidators();
    }
  }

  withStandardValidators() {
    configStandardValidators(this);
  }

  resolveValidator(rule) {
    // console.log('resolveValidator: ' + JSON.stringify(rule));

    const found = _.find(this.availableValidators, v => v.test(rule));
    if (!found) return;

    const {validatorImp, transformer} = found;
    if (validatorImp) {
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
        _.each(options, (v, name) => variation[`$${name}`] = v);

        if (valueEval) {
          variation.$value = valueEval(scope);
        }

        // console.log('');
        // console.log('eval rule: '+ JSON.stringify(rule));
        // console.log('with variation ' + JSON.stringify(variation));
        // console.log('');
        return validator(scopeVariation(scope, variation));
      };
    } else if (transformer) {
      // transformer
      const transformed = transformer(rule, this.buildValidator);
      if (transformed.beenBuilt) {
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

  validate(model, rulesMap, helper = {}) {
    // use ...model to avoid scope variation to pollute model
    // add lodash to helper by default
    const scope = createSimpleScope({...model}, {_, ...helper});
    return this._validate(scope, rulesMap);
  }

  _validate(scope, rulesMap) {
    let error = {};

    _.each(rulesMap, (rules, propertyName) => {
      const value = valueEvaluator(propertyName)(scope);
      // console.log('propertyName:'+propertyName);
      // console.log('value:'+value);
      const localScope = scopeVariation(scope, {
        $value: value,
        $propertyName: propertyName,
      });

      // try if it's a single validation
      const singleValidation = this.resolveValidator(rules);

      // wrap single validation in array
      if (singleValidation ||
          _.isString(rules) ||
          _.isRegExp(rules) ||
          _.isFunction(rules)) {
        rules = [rules];
      }

      if (_.isArray(rules)) {
        const validator = this.buildValidator(rules);
        const result = validator(localScope);
        if (!result.isValid) {
          error[propertyName] = result.messages;
        }
      } else if (_.isPlainObject(rules)) {
        const nested = rules;

        // TODO
      }

    });

    return error;
  }

}

export default Validation;
