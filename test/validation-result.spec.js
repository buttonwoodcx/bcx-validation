import test from 'tape';
import ValidationResult from '../src/validation-result';

function v(result) {
  return new ValidationResult(result);
}

test('ValidationResult: undefined or null means pass', t => {
  t.deepLooseEqual(v(), {isValid: true});
  t.deepLooseEqual(v(null), {isValid: true});
  t.end();
});

test('ValidationResult: boolean means pass or fail', t => {
  t.deepLooseEqual(v(true), {isValid: true});
  t.deepLooseEqual(v(false), {isValid: false, errors: ['invalid']});
  t.end();
});

test('ValidationResult: non-empty string means error message', t => {
  t.deepLooseEqual(v(""), {isValid: true});
  t.deepLooseEqual(v("bar"), {isValid: false, errors: ["bar"]});
  t.end();
});

test('ValidationResult: array of non-empty string means error messages, remove duplicated messages', t => {
  t.deepLooseEqual(v(["", "", ""]), {isValid: true});
  t.deepLooseEqual(v(["", "bar"]), {isValid: false, errors: ["bar"]});
  t.deepLooseEqual(v(["foo", "", "bar", "lorem", "foo"]), {isValid: false, errors: ["foo", "bar", "lorem"]});
  t.end();
});

test('ValidationResult: can set inValid and message(s) explictly, remove duplicated messages', t => {
  t.deepLooseEqual(v({isValid: true}), {isValid: true});
  t.deepLooseEqual(v({isValid: true, break: true}), {isValid: true, break: true});

  t.deepLooseEqual(v({isValid: true, message: 'ignore'}), {isValid: true});
  t.deepLooseEqual(v({isValid: true, messages: ['ignore']}), {isValid: true});

  t.deepLooseEqual(v({isValid: false, message: 'bar'}), {isValid: false, errors: ["bar"]});
  t.deepLooseEqual(v({isValid: false, message: 'bar', break: true}), {isValid: false, errors: ["bar"], break: true});
  t.deepLooseEqual(v({isValid: false, message: ''}), {isValid: false, errors: ["invalid"]});
  t.deepLooseEqual(v({isValid: false}), {isValid: false, errors: ["invalid"]});
  t.deepLooseEqual(v({isValid: false, messages: ['foo', 'bar', '', 'foo']}), {isValid: false, errors: ['foo', 'bar']});
  t.end();
});

test('ValidationResult: can skip inValid explictly', t => {
  t.deepLooseEqual(v({isValid: null}), {isValid: null});
  t.deepLooseEqual(v({isValid: null, break: true}), {isValid: null, break: true});
  t.end();
});

test('ValidationResult: handles tri-state isValid', t => {
  t.deepLooseEqual(v([{isValid: true}, {isValid: true}]), {isValid: true});
  t.deepLooseEqual(v([{isValid: null}, {isValid: null}]), {isValid: null});
  t.deepLooseEqual(v([{isValid: false}, {isValid: false}]), {isValid: false, errors: ['invalid']});
  t.deepLooseEqual(v([{isValid: null}, {isValid: true}]), {isValid: true});
  t.deepLooseEqual(v([{isValid: true}, {isValid: null}]), {isValid: true});
  t.deepLooseEqual(v([{isValid: true}, {isValid: false}]), {isValid: false, errors: ['invalid']});
  t.deepLooseEqual(v([{isValid: false}, {isValid: true}]), {isValid: false, errors: ['invalid']});
  t.deepLooseEqual(v([{isValid: null}, {isValid: false}]), {isValid: false, errors: ['invalid']});
  t.deepLooseEqual(v([{isValid: false}, {isValid: null}]), {isValid: false, errors: ['invalid']});
  t.end();
});

test('ValidationResult: surfaces out final break in chain', t => {
  const chain = [
    {isValid: false, errors: ['foo'], break: true}
  ];

  // the first break is not final break
  t.deepLooseEqual(v(chain), {isValid: false, errors: ['foo']});

  const chain2 = [
    {isValid: true},
    {isValid: false, errors: ['foo'], break: true}
  ];

  // final break
  chain2.break = true;
  t.deepLooseEqual(v(chain2), {isValid: false, errors: ['foo'], break: true});
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

  t.deepLooseEqual(v(result), {
    isValid: false,
    errors: ["foo", "bar", "bar1", "inner", "hello", "last"]
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
  t.deepLooseEqual(v(p), {isValid: true});
  t.deepLooseEqual(v(f), {isValid: false, errors: ['bar'], break: true});
  t.end();
});

test('ValidationResult: merge nested errors', t => {
  let result = [
    {isValid: true},
    {isValid: false, errors: {a: ['bar'], b: ['foo']}}
  ];

  t.deepLooseEqual(v(result), {
    isValid: false,
    errors: {a: ['bar'], b: ['foo']}
  });

  result = [
    "bar",
    {isValid: false, errors: {a: ['bar'], b: ['foo']}},
    {isValid: false, errors: {a: ['bar', 'goo'], b: ['foo']}}
  ];

  t.deepLooseEqual(v(result), {
    isValid: false,
    errors: {__base__: ['bar'], a: ['bar', 'goo'], b: ['foo']}
  });

  result = [
    {isValid: false, errors: {a: ['bar'], b: ['foo']}},
    ["bar", 'foo'],
    {isValid: false, errors: {a: ['bar', 'goo'], b: ['foo']}}
  ];

  t.deepLooseEqual(v(result), {
    isValid: false,
    errors: {__base__: ['bar', 'foo'], a: ['bar', 'goo'], b: ['foo']}
  });
  t.end();
});

test('ValidationResult: merge deep nested errors', t => {
  let result = [
    [
      {isValid: true},
      ['foo', 'goo'],
      {isValid: false, errors: {a: ['bar'], b: ['goo', 'foo']}}
    ],
    [
      "bar  ",
      {isValid: false, errors: {a: ['bar'], b: ['foo']}},
      {isValid: false, errors: {__base__: ['xyz'], a: ['bar', 'goo'], b: ['foo']}}
    ]
  ];

  t.deepLooseEqual(v(result), {
    isValid: false,
    errors: {__base__: ['foo', 'goo', 'bar', 'xyz'], a: ['bar', 'goo'], b: ['goo', 'foo']}
  });

  t.end();
});



