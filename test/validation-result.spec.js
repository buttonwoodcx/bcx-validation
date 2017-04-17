import test from 'tape';
import ValidationResult from '../src/validation-result';

function v(result) {
  return new ValidationResult(result);
}

test('ValidationResult: undefined or null means pass', t => {
  t.deepEqual(v(), {isValid: true, messages: [], break: false});
  t.deepEqual(v(null), {isValid: true, messages: [], break: false});
  t.end();
});

test('ValidationResult: boolean means pass or fail', t => {
  t.deepEqual(v(true), {isValid: true, messages: [], break: false});
  t.deepEqual(v(false), {isValid: false, messages: ['invalid'], break: false});
  t.end();
});

test('ValidationResult: non-empty string means error message', t => {
  t.deepEqual(v(""), {isValid: true, messages: [], break: false});
  t.deepEqual(v("bar"), {isValid: false, messages: ["bar"], break: false});
  t.end();
});

test('ValidationResult: array of non-empty string means error messages, remove duplicated messages', t => {
  t.deepEqual(v(["", "", ""]), {isValid: true, messages: [], break: false});
  t.deepEqual(v(["", "bar"]), {isValid: false, messages: ["bar"], break: false});
  t.deepEqual(v(["foo", "", "bar", "lorem", "foo"]), {isValid: false, messages: ["foo", "bar", "lorem"], break: false});
  t.end();
});

test('ValidationResult: can set inValid and message(s) explictly, remove duplicated messages', t => {
  t.deepEqual(v({isValid: true}), {isValid: true, messages: [], break: false});
  t.deepEqual(v({isValid: true, break: true}), {isValid: true, messages: [], break: true});

  t.deepEqual(v({isValid: true, message: 'ignore'}), {isValid: true, messages: [], break: false});
  t.deepEqual(v({isValid: true, messages: ['ignore']}), {isValid: true, messages: [], break: false});

  t.deepEqual(v({isValid: false, message: 'bar'}), {isValid: false, messages: ["bar"], break: false});
  t.deepEqual(v({isValid: false, message: 'bar', break: true}), {isValid: false, messages: ["bar"], break: true});
  t.deepEqual(v({isValid: false, message: ''}), {isValid: false, messages: ["invalid"], break: false});
  t.deepEqual(v({isValid: false}), {isValid: false, messages: ["invalid"], break: false});
  t.deepEqual(v({isValid: false, messages: ['foo', 'bar', '', 'foo']}), {isValid: false, messages: ['foo', 'bar'], break: false});
  t.end();
});

test('ValidationResult: can skip inValid explictly', t => {
  t.deepEqual(v({isValid: null}), {isValid: null, messages: [], break: false});
  t.deepEqual(v({isValid: null, break: true}), {isValid: null, messages: [], break: true});
  t.end();
});

test('ValidationResult: handles tri-state isValid', t => {
  t.deepEqual(v([{isValid: true}, {isValid: true}]), {isValid: true, messages: [], break: false});
  t.deepEqual(v([{isValid: null}, {isValid: null}]), {isValid: null, messages: [], break: false});
  t.deepEqual(v([{isValid: false}, {isValid: false}]), {isValid: false, messages: ['invalid'], break: false});
  t.deepEqual(v([{isValid: null}, {isValid: true}]), {isValid: true, messages: [], break: false});
  t.deepEqual(v([{isValid: true}, {isValid: null}]), {isValid: true, messages: [], break: false});
  t.deepEqual(v([{isValid: true}, {isValid: false}]), {isValid: false, messages: ['invalid'], break: false});
  t.deepEqual(v([{isValid: false}, {isValid: true}]), {isValid: false, messages: ['invalid'], break: false});
  t.deepEqual(v([{isValid: null}, {isValid: false}]), {isValid: false, messages: ['invalid'], break: false});
  t.deepEqual(v([{isValid: false}, {isValid: null}]), {isValid: false, messages: ['invalid'], break: false});
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
    messages: ["foo", "bar", "bar1", "inner", "hello", "last"],
    break: false
  });
  t.end();
});

test('ValidationResult: rejects unpected result', t => {
  t.throws(() => v(0));
  t.throws(() => v(1));
  t.throws(() => v({}));
  t.throws(() => v({message: 'bar'}));
  t.throws(() => v({messages: ['bar']}));
  t.throws(() => v(/hello/));
  t.end();
});

test('ValidationResult: double wrap has no effect', t => {
  const p = v({isValid: true, message: 'ignore'});
  const f = v({isValid: false, message: 'bar', break: true});
  t.deepEqual(v(p), {isValid: true, messages: [], break: false});
  t.deepEqual(v(f), {isValid: false, messages: ['bar'], break: true});
  t.end();
});
