import test from 'tape';
import _ from 'lodash';
import valueEvaluator from '../src/value-evaluator';
import buildValidator from '../src/build-validator';
import {createSimpleScope} from 'bcx-expression-evaluator';

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
  t.deepEqual(validator(createSimpleScope({$value: 'pass'}, {})),
              {isValid: true, messages: [], break: false});
  t.deepEqual(validator(createSimpleScope({$value: 'fail'}, {})),
              {isValid: false, messages: ['lorem'], break: false});
  t.end();
});

test('buildValidator: builds on raw func with early break on pass', t => {
  function test(value) {
    if (value === 'fail') return 'lorem';
  };

  test.stopValidationChainIfPass = true;

  const validator = buildValidator(test, validatorResolveDummy);
  t.deepEqual(validator(createSimpleScope({$value: 'pass'}, {})),
              {isValid: true, messages: [], break: true});
  t.deepEqual(validator(createSimpleScope({$value: 'fail'}, {})),
              {isValid: false, messages: ['lorem'], break: false});
  t.end();
});

test('buildValidator: builds on raw func with early break on fail', t => {
  function test(value) {
    if (value === 'fail') return 'lorem';
  };

  test.stopValidationChainIfFail = true;

  const validator = buildValidator(test, validatorResolveDummy);
  t.deepEqual(validator(createSimpleScope({$value: 'pass'}, {})),
              {isValid: true, messages: [], break: false});
  t.deepEqual(validator(createSimpleScope({$value: 'fail'}, {})),
              {isValid: false, messages: ['lorem'], break: true});
  t.end();
});

test('buildValidator: wraps bare expression, override $value to test', t => {
  const validator = buildValidator("a > 3", validatorResolveDummy);
  t.deepEqual(validator(createSimpleScope({$value: 1, a: 4}, {})),
              {isValid: true, messages: [], break: false});

  t.deepEqual(validator(createSimpleScope({$value: 1, a: 2}, {})),
              {isValid: false, messages: ['invalid'], break: false});
  t.end();
});

test('buildValidator: transform single string with validatorResolve', t => {
  const validator = buildValidator("notTrue", validatorResolveDummy);
  t.deepEqual(validator(createSimpleScope({$value: 0, a: 4}, {})),
              {isValid: true, messages: [], break: false});

  t.deepEqual(validator(createSimpleScope({$value: 1, a: 2}, {})),
              {isValid: false, messages: ['invalid'], break: false});
  t.end();
});

test('buildValidator: wraps regex, override $value to test', t => {
  const validator = buildValidator(/^ok/, validatorResolveDummy);
  t.deepEqual(validator(createSimpleScope({$value: "ok"}, {})),
              {isValid: true, messages: [], break: false});

  t.deepEqual(validator(createSimpleScope({$value: "not ok"}, {})),
              {isValid: false, messages: ['invalid'], break: false});
  t.end();
});

test('buildValidator: resolve known validator', t => {
  let validator;

  validator = buildValidator(
    {validate: 'isTrue', message: "must be true"},
    validatorResolveDummy
  );

  t.deepEqual(validator(createSimpleScope({$value: true}, {})),
              {isValid: true, messages: [], break: false});

  t.deepEqual(validator(createSimpleScope({$value: ""}, {})),
              {isValid: false, messages: ['must be true'], break: false});

  // early break
  validator = buildValidator(
    {validate: 'isTrue', stopValidationChainIfPass: true},
    validatorResolveDummy
  );

  t.deepEqual(validator(createSimpleScope({$value: true}, {})),
              {isValid: true, messages: [], break: true});

  t.deepEqual(validator(createSimpleScope({$value: ""}, {})),
              {isValid: false, messages: ['invalid'], break: false});

  validator = buildValidator(
    {validate: 'isTrue', stopValidationChainIfFail: true},
    validatorResolveDummy
  );

  t.deepEqual(validator(createSimpleScope({$value: true}, {})),
              {isValid: true, messages: [], break: false});

  t.deepEqual(validator(createSimpleScope({$value: ""}, {})),
              {isValid: false, messages: ['invalid'], break: true});

  // customize value (why testing my test dummy code??)
  validator = buildValidator(
    {validate: 'isTrue', value: "$value > 3", message: "a (${$value}) must be greater than 3"},
    validatorResolveDummy
  );

  t.deepEqual(validator(createSimpleScope({$value: 4}, {})),
              {isValid: true, messages: [], break: false});

  t.deepEqual(validator(createSimpleScope({$value: 1}, {})),
              {isValid: false, messages: ['a (1) must be greater than 3'], break: false});

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
  t.deepEqual(validator(createSimpleScope({}, {})),
              {isValid: true, messages: [], break: false});

  validator = buildValidator(
    [
      {mock: 'pass'},
      {mock: 'pass'},
      {mock: 'pass'}
    ],
    validatorResolveDummy
  );
  t.deepEqual(validator(createSimpleScope({}, {})),
              {isValid: true, messages: [], break: false});

  validator = buildValidator(
    [
      {mock: 'fail'},
      {mock: 'pass'},
      {mock: 'fail', message: 'bar${1+1}'}
    ],
    validatorResolveDummy
  );
  t.deepEqual(validator(createSimpleScope({}, {})),
              {isValid: false, messages: ['invalid', 'bar2'], break: false});

  validator = buildValidator(
    [
      {mock: 'fail', break: true},
      {mock: 'pass'},
      {mock: 'fail', message: 'bar'}
    ],
    validatorResolveDummy
  );
  t.deepEqual(validator(createSimpleScope({}, {})),
              {isValid: false, messages: ['invalid'], break: false});

  validator = buildValidator(
    [
      {mock: 'fail'},
      {mock: 'pass', break: true},
      {mock: 'fail', message: 'bar'}
    ],
    validatorResolveDummy
  );
  t.deepEqual(validator(createSimpleScope({}, {})),
              {isValid: false, messages: ['invalid'], break: false});

  validator = buildValidator(
    [
      {mock: 'pass', break: true},
      {mock: 'fail'},
      {mock: 'fail', message: 'bar'}
    ],
    validatorResolveDummy
  );
  t.deepEqual(validator(createSimpleScope({}, {})),
              {isValid: true, messages: [], break: false});

  t.end();
});

