import test from 'tape';
import Validation from '../../src/validation';
import _ from 'lodash';

const v = new Validation();

test('if: skip test if condition is true', t => {
  let rule = {a: {if: "$value !== 'NA'", validate: "email"}};

  t.deepEqual(v.validate({a: 'NA'}, rule), {});
  t.deepEqual(v.validate({a: 'ab@test.com'}, rule), {});
  t.deepEqual(v.validate({a: 'a'}, rule), {a: ["not a valid email"]});
  t.end();
});

test('if: support stopValidationChainIfPass', t => {
  let rule = {a: [
    {if: "$value === 'NA'", validate: "isTrue", value: "true", stopValidationChainIfPass: true},
    "email"
  ]};

  t.deepEqual(v.validate({a: 'NA'}, rule), {});
  t.deepEqual(v.validate({a: 'ab@test.com'}, rule), {});
  t.deepEqual(v.validate({a: 'a'}, rule), {a: ["not a valid email"]});
  t.end();
});

test('if: support stopValidationChainIfFail', t => {
  let rule = {a: [
    {if: "$value === 'NA'", validate: "isTrue", value: "false", stopValidationChainIfFail: true, message: "email cannot be NA"},
    "email"
  ]};

  t.deepEqual(v.validate({a: 'NA'}, rule), {a: ["email cannot be NA"]});
  t.deepEqual(v.validate({a: 'ab@test.com'}, rule), {});
  t.deepEqual(v.validate({a: 'a'}, rule), {a: ["not a valid email"]});
  t.end();
});

test('if: support group', t => {
  let rule = {a: {if: 'mixCase', group: [/[a-z]/, /[A-Z]/], message: 'must contain both lower case and upper case letters'},
    };

  t.deepEqual(v.validate({a: 'NA'}, rule), {});
  t.deepEqual(v.validate({a: 'NA', mixCase: true}, rule), {a: ["must contain both lower case and upper case letters"]});
  t.deepEqual(v.validate({a: 'NAa', mixCase: true}, rule), {});
  t.end();
});

test('if: smart enough to separate validation from if transformer', t => {
  t.deepEqual(v.validate({meta: {if: ''}}, {meta: {if: 'mandatory'}}),
    {meta: {if: ['must not be empty']}});

  // not smart enough for this
  t.throws(() => v.validate({meta: {if: '', else: ''}}, {meta: {if: 'mandatory', else: 'mandatory'}}));

  // need to be explicit
  t.deepEqual(v.validate({meta: {if: '', else: ''}}, {meta: {if: {validate: 'mandatory'}, else: 'mandatory'}}),
    {meta: {if: ['must not be empty'], else: ['must not be empty']}});

  t.end();
});
