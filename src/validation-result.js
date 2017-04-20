import _ from 'lodash';

const BASE = '__base__';

function mergeArray(objValue, srcValue) {
  if (_.isArray(objValue)) {
    return objValue.concat(srcValue);
  }
}

export function mergedErrors(errs1, errs2) {
  let result = {
    [BASE]: []
  };

  function _merge(errs) {
    if (errs) {
      if (_.isArray(errs)) {
        _.mergeWith(result, {[BASE]: errs}, mergeArray);
      } else if (_.isObjectLike(errs)) {
        _.mergeWith(result, errs, mergeArray);
      }
    }
  }

  _merge(errs1);
  _merge(errs2);

  result = _.mapValues(result, v => _.isArray(v) ?
                                    _(v).compact().map(_.trim).uniq().value() :
                                    v);

  let cleanResult = {};
  _.each(result, (v, k) => {
    if (!_.isEmpty(v)) cleanResult[k] = v;
  });

  if (_.size(cleanResult) === 1 && cleanResult[BASE]) {
    // only top level errors
    return cleanResult[BASE];
  } else {
    return cleanResult;
  }
};

export default class ValidationResult {

  // normalize validation result
  constructor(result) {
    this.isValid = true;

    if (_.isUndefined(result) || _.isNull(result)) return;

    if (_.isBoolean(result)) {
      this.isValid = result;
      if (!this.isValid) {
        // default error message
        this.mergeErrors(['invalid']);
      }
    } else if (_.isString(result)) {
      if (!_.isEmpty(_.trim(result))) {
        this.isValid = false;
        this.mergeErrors([result]);
      }
    } else if (_.isArray(result)) {
      let finalIsValid = null;
      _.each(result, r => {
        let validationResult;
        if (r instanceof ValidationResult) {
          validationResult = r;
        } else {
          validationResult = new ValidationResult(r);
        }

        if (validationResult.isValid === true) {
          if (finalIsValid !== false) finalIsValid = true;
        } else if (validationResult.isValid === false) {
          finalIsValid = false;
          this.mergeErrors(validationResult.errors);
        }

        this.isValid = finalIsValid;
      });
    } else if (_.has(result, 'isValid')) {
      // isValid is tri-state
      // true, false, or null (don't care, skip)
      if (result.isValid === null) {
        this.isValid = null;
      } else {
        this.isValid = !!result.isValid;
      }

      if (result.break) this.break = true;
      if (this.isValid !== false) return;

      if (result.message) this.mergeErrors([result.message]);
      else if (result.messages) this.mergeErrors(result.messages);
      else if (result.errors) this.mergeErrors(result.errors);

      if (_.isEmpty(this.errors)) {
        // default error message
        this.mergeErrors(['invalid']);
      }
    } else {
      throw new Error(`Unexpected validation result (type=${typeof result}, ${JSON.stringify(result)})`);
    }
  }

  mergeErrors(errors) {
    this.errors = mergedErrors(this.errors, errors);
  }
}
