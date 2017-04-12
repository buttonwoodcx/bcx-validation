import _ from 'lodash';

export default function (validators) {
  return scope => {
    let results = [];

    _.each(validators, validator => {
      const result = validator(scope);
      results.push(result);

      // early break
      if (result && result.break) return false;
    });

    return results;
  };
}