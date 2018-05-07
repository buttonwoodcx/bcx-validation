import _ from 'lodash';

const BASE = '__base__';

function uniqCompact(arr1 = [], arr2 = []) {
  return _([...arr1, ...arr2]).map(_.trim).compact().uniq().value();
}

function mergeErrorUnit(e1, e2) {
  if (_.isArray(e1) && _.isArray(e2)) {
    return uniqCompact(e1, e2);
  } else if (_.isArray(e1) && _.isPlainObject(e2)) {
    const baseErrors = uniqCompact(e1, e2[BASE]);
    let merged = {...e2};
    if (baseErrors.length) merged[BASE] = baseErrors;
    return merged;
  } else if (_.isArray(e2) && _.isPlainObject(e1)) {
    const baseErrors = uniqCompact(e2, e1[BASE]);
    let merged = {...e1};
    if (baseErrors.length) merged[BASE] = baseErrors;
    return merged;
  }
}

export function mergedErrors(errs1, errs2) {
  const merged = _.mergeWith({e: errs1 || []}, {e: errs2}, mergeErrorUnit);
  return merged.e;
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

      // final break in chain surfaces out
      if (result.break) this.break = true;
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
