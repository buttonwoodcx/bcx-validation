import test from 'tape';
import {ValidationResult} from '../src/validation-result';

function v(result) {
  return new ValidationResult(result);
}

test('ValidationResult: undefined or null means pass', t => {
  t.deepEqual(v(), {isValid: true, messages: []});
  t.deepEqual(v(null), {isValid: true, messages: []});
  t.end();
});

test('ValidationResult: non-empty string means error message', t => {
  t.deepEqual(v(""), {isValid: true, messages: []});
  t.deepEqual(v("bar"), {isValid: false, messages: ["bar"]});
  t.end();
});

test('ValidationResult: array of non-empty string means error messages, remove duplicated messages', t => {
  t.deepEqual(v(["", "", ""]), {isValid: true, messages: []});
  t.deepEqual(v(["", "bar"]), {isValid: false, messages: ["bar"]});
  t.deepEqual(v(["foo", "", "bar", "lorem", "foo"]), {isValid: false, messages: ["foo", "bar", "lorem"]});
  t.end();
});

test('ValidationResult: can set inValid and message(s) explictly, remove duplicated messages', t => {
  t.deepEqual(v({isValid: true}), {isValid: true, messages: []});
  t.deepEqual(v({isValid: true, message: 'ignore'}), {isValid: true, messages: []});
  t.deepEqual(v({isValid: true, messages: ['ignore']}), {isValid: true, messages: []});

  t.deepEqual(v({isValid: false, message: 'bar'}), {isValid: false, messages: ["bar"]});
  t.deepEqual(v({isValid: false, message: ''}), {isValid: false, messages: ["invalid"]});
  t.deepEqual(v({isValid: false}), {isValid: false, messages: ["invalid"]});
  t.deepEqual(v({isValid: false, messages: ['foo', 'bar', '', 'foo']}), {isValid: false, messages: ['foo', 'bar']});
  t.end();
});

test('ValidationResult: processes nested result, remove duplicated messages', t => {
  const result = [
    "foo",
    {isValid: true, message: 'ignore'},
    [
      {isValid: false, messages: [' bar ', 'bar1']},
      {isValid: true},
      new ValidationResult("inner"),
      ["hello", "bar"]
    ],
    null,
    new ValidationResult(),
    new ValidationResult("last")
  ];

  t.deepEqual(v(result), {
    isValid: false,
    messages: ["foo", "bar", "bar1", "inner", "hello", "last"]
  });
  t.end();
});

test('ValidationResult: rejects unpected result', t => {
  t.throws(() => v({}));
  t.throws(() => v({message: 'bar'}));
  t.throws(() => v({messages: ['bar']}));
  t.throws(() => v(/hello/));
  t.end();
});
