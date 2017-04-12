import buildValidator from './build-validator';
import {evaluate, createOverrideContext, createSimpleScope} from 'bcx-expression-evaluator';
import valueEvaluator from './value-evaluator';
import scopeVariation from './scope-variation';
import standardValidators from './standard-validators';
import _ from 'lodash';

const NAME_FORMAT = /^[a-z][a-z0-9_]+/i;
const NAME_FORMAT_ERROR = 'validation name must start with a letter, followed by letters, digits or underscore (_)';

class Validation {

  constructor() {
    this.resolveValidator = this.resolveValidator.bind(this);

    this.availableValidators = [];
    // do we need a flag to opt-out standard validators?
    this.withStandardValidators();
  }

  withStandardValidators() {
    _.each(standardValidators, pair => {
      const [name, imp] = pair;
      this.addValidator(name, imp);
    });
  }

  resolveValidator(rule) {
    const found = _.find(this.availableValidators, v => evaluate(v.test, rule));
    if (!found) return;

    const {validator} = found;
    const value = _.get(rule, 'value', '');
    const options = _.omit(rule, ['value', 'validate']);

    if (_.isEmpty(value) && _.isEmpty(options)) return validator;

    // otherwise, override scope with value and options
    return scope => {
      let variation = {...options};

      if (value) {
        variation.$value = valueEvaluator(value)(scope);
      }

      return validator(scopeVariation(scope, variation));
    };
  }

  addValidator(validationName, imp) {
    const name = _.trim(validationName);
    if (_.isEmpty(name)) throw new Error("Missing validation name.");

    if (!NAME_FORMAT.test(name)) {
      throw new Error(`${name} : ${NAME_FORMAT_ERROR}`);
    }

    const tester = `validate === '${name}'`;

    this.availableValidators.push({
      test: tester,
      validator: buildValidator(imp, this.resolveValidator)
    });
  }

  validate(model, rulesMap, helper = {}) {
    // by default add lodash to helper
    const scope = createSimpleScope(model, {_, ...helper});
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

      const singleValidation = this.resolveValidator(rules);

      if (singleValidation ||
          _.isString(rules) ||
          _.isRegExp(rules) ||
          _.isFunction(rules)) {
        rules = [rules];
      }

      if (_.isArray(rules)) {
        const valiadtor = buildValidator(rules, this.resolveValidator);
        const result = valiadtor(localScope);
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
