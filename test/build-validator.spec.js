import test from 'tape';
import _ from 'lodash';
import valueEvaluator from '../src/value-evaluator';
import buildValidator from '../src/build-validator';
import {createScope} from 'bcx-expression-evaluator';

function validatorResolveDummy(rule) {
  if (rule && rule.validate === 'isTrue') {
    const e = valueEvaluator(rule.value || '$value');
    return scope => !!e(scope);
  } else if (rule && rule.mock) {
    let result = {};
    result.isValid = rule.mock === 'pass';
    result.break = !!rule.break;
    return () => result;
  } else if (rule === 'notTrue') {
    const e = valueEvaluator('$value');
    return scope => !e(scope);
  }
  // else return nothing
};

test('buildValidator: builds on raw func', t => {
  function test(value) {
    if (value === 'fail') return 'lorem';
  };

  const validator = buildValidator(test, validatorResolveDummy);
  t.deepEqual(validator(createScope({$value: 'pass'}, {})),
              {isValid: true});
  t.deepEqual(validator(createScope({$value: 'fail'}, {})),
              {isValid: false, errors: ['lorem']});
  t.end();
});

test('buildValidator: builds on raw func with early break on pass', t => {
  function test(value) {
    if (value === 'fail') return 'lorem';
  };

  test.stopValidationChainIfPass = true;

  const validator = buildValidator(test, validatorResolveDummy);
  t.deepEqual(validator(createScope({$value: 'pass'}, {})),
              {isValid: true, break: true});
  t.deepEqual(validator(createScope({$value: 'fail'}, {})),
              {isValid: false, errors: ['lorem']});
  t.end();
});

test('buildValidator: builds on raw func with early break on fail', t => {
  function test(value) {
    if (value === 'fail') return 'lorem';
  };

  test.stopValidationChainIfFail = true;

  const validator = buildValidator(test, validatorResolveDummy);
  t.deepEqual(validator(createScope({$value: 'pass'}, {})),
              {isValid: true});
  t.deepEqual(validator(createScope({$value: 'fail'}, {})),
              {isValid: false, errors: ['lorem'], break: true});
  t.end();
});

test('buildValidator: wraps bare expression, override $value to test', t => {
  const validator = buildValidator("a > 3", validatorResolveDummy);
  t.deepEqual(validator(createScope({$value: 1, a: 4}, {})),
              {isValid: true});

  t.deepEqual(validator(createScope({$value: 1, a: 2}, {})),
              {isValid: false, errors: ['invalid']});
  t.end();
});

test('buildValidator: transform single string with validatorResolve', t => {
  const validator = buildValidator("notTrue", validatorResolveDummy);
  t.deepEqual(validator(createScope({$value: 0, a: 4}, {})),
              {isValid: true});

  t.deepEqual(validator(createScope({$value: 1, a: 2}, {})),
              {isValid: false, errors: ['invalid']});
  t.end();
});

test('buildValidator: wraps regex, override $value to test', t => {
  const validator = buildValidator(/^ok/, validatorResolveDummy);
  t.deepEqual(validator(createScope({$value: "ok"}, {})),
              {isValid: true});

  t.deepEqual(validator(createScope({$value: "not ok"}, {})),
              {isValid: false, errors: ['invalid']});
  t.end();
});

test('buildValidator: resolve known validator', t => {
  let validator;

  validator = buildValidator(
    {validate: 'isTrue', message: "must be true"},
    validatorResolveDummy
  );

  t.deepEqual(validator(createScope({$value: true}, {})),
              {isValid: true});

  t.deepEqual(validator(createScope({$value: ""}, {})),
              {isValid: false, errors: ['must be true']});

  // early break
  validator = buildValidator(
    {validate: 'isTrue', stopValidationChainIfPass: true},
    validatorResolveDummy
  );

  t.deepEqual(validator(createScope({$value: true}, {})),
              {isValid: true, break: true});

  t.deepEqual(validator(createScope({$value: ""}, {})),
              {isValid: false, errors: ['invalid']});

  validator = buildValidator(
    {validate: 'isTrue', stopValidationChainIfFail: true},
    validatorResolveDummy
  );

  t.deepEqual(validator(createScope({$value: true}, {})),
              {isValid: true});

  t.deepEqual(validator(createScope({$value: ""}, {})),
              {isValid: false, errors: ['invalid'], break: true});

  // customize value (why testing my test dummy code??)
  validator = buildValidator(
    {validate: 'isTrue', value: "$value > 3", message: "a (${$value}) must be greater than 3"},
    validatorResolveDummy
  );

  t.deepEqual(validator(createScope({$value: 4}, {})),
              {isValid: true});

  t.deepEqual(validator(createScope({$value: 1}, {})),
              {isValid: false, errors: ['a (1) must be greater than 3']});

  t.end();
});

test('buildValidator: rejects unknown rule', t => {
  t.throws(() => buildValidator(
    {unknown: 1},
    validatorResolveDummy
  ));
  t.end();
});

test('buildValidator: builds chain of validators', t => {
  let validator;

  validator = buildValidator(
    [],
    validatorResolveDummy
  );
  t.deepEqual(validator(createScope({}, {})),
              {isValid: true});

  validator = buildValidator(
    [
      {mock: 'pass'},
      {mock: 'pass'},
      {mock: 'pass'}
    ],
    validatorResolveDummy
  );
  t.deepEqual(validator(createScope({}, {})),
              {isValid: true});

  validator = buildValidator(
    [
      {mock: 'fail'},
      {mock: 'pass'},
      {mock: 'fail', message: 'bar${1+1}'}
    ],
    validatorResolveDummy
  );
  t.deepEqual(validator(createScope({}, {})),
              {isValid: false, errors: ['invalid', 'bar2']});

  validator = buildValidator(
    [
      {mock: 'fail', break: true},
      {mock: 'pass'},
      {mock: 'fail', message: 'bar'}
    ],
    validatorResolveDummy
  );
  t.deepEqual(validator(createScope({}, {})),
              {isValid: false, errors: ['invalid']});

  validator = buildValidator(
    [
      {mock: 'fail'},
      {mock: 'pass', break: true},
      {mock: 'fail', message: 'bar'}
    ],
    validatorResolveDummy
  );
  t.deepEqual(validator(createScope({}, {})),
              {isValid: false, errors: ['invalid']});

  validator = buildValidator(
    [
      {mock: 'pass', break: true},
      {mock: 'fail'},
      {mock: 'fail', message: 'bar'}
    ],
    validatorResolveDummy
  );
  t.deepEqual(validator(createScope({}, {})),
              {isValid: true});

  t.end();
});

