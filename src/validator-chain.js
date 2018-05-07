import _ from 'lodash';

export default function (validators) {
  return scope => {
    let results = [];
    let len = validators.length;
    let finalBreak = false;

    for (let i = 0; i < len; i ++) {
      const result = validators[i](scope);
      results.push(result);

      if (i === len - 1 && result && result.break) {
        finalBreak = true;
      }

      // early break
      if (result && result.break) break;
    }

    // final break in chain surfaces out
    if (finalBreak) results.break = true;
    return results;
  };
}