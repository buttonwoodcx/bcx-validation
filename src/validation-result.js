import _ from 'lodash';

export default class ValidationResult {

  // normalize validation result
  constructor(result) {
    this.isValid = true;
    this.messages = [];
    this.break = false;

    if (_.isUndefined(result) || _.isNull(result)) return;

    if (_.isBoolean(result)) {
      this.isValid = result;
      if (!this.isValid) {
        // default error message
        this.addErrorMessage('invalid');
      }
    } else if (_.isString(result)) {
      this.addErrorMessage(result);
    } else if (_.isArray(result)) {
      _.each(result, r => {
        let validationResult;
        if (r instanceof ValidationResult) {
          validationResult = r;
        } else {
          validationResult = new ValidationResult(r);
        }

        if (!validationResult.isValid) {
          _.each(validationResult.messages, m => {
            this.addErrorMessage(m);
          });
        }
      });
    } else if (_.has(result, 'isValid')) {
      this.isValid = !!result.isValid;
      this.break = !!result.break;
      if (this.isValid) return;

      this.addErrorMessage(result.message);

      _.each(result.messages, m => {
        this.addErrorMessage(m);
      });

      if (_.isEmpty(this.messages)) {
        // default error message
        this.addErrorMessage('invalid');
      }
    } else {
      throw new Error(`Unexpected validation result:${result}`);
    }
  }

  addErrorMessage(message) {
    if (!_.isString(message)) return;

    const trimed = _.trim(message);
    if (_.isEmpty(trimed)) return;

    this.isValid = false;

    if (_.includes(this.messages, trimed)) return;
    this.messages.push(trimed);
  }

}
