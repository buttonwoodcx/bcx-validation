import test from 'tape';
import Validation from '../../src/validation';
import _ from 'lodash';

const v = new Validation();

test('isTrue: validates isTrue', t => {
  let rule = {a: "isTrue"};
  t.equal(v.validate({a: true}, rule), undefined);
  t.deepEqual(v.validate({a: false}, rule), {a: ['must be true']});

  rule = {a: {validate: "isTrue", message: '${$propertyPath}:${$value} is not true'}};
  t.equal(v.validate({a: true}, rule), undefined);
  t.deepEqual(v.validate({a: false}, rule), {a: ['a:false is not true']});

  rule = {
    a: {
      validate: "isTrue",
      value: "b < c",
      message: "b:${$this.b} must be smaller than c:${$this.c}"
    }
  };
  t.equal(v.validate({a: false, b: 1, c: 2}, rule), undefined);
  t.deepEqual(v.validate({a: true, b: 2, c: 1}, rule), {a: ['b:2 must be smaller than c:1']});

  rule = {
    a: [{
      validate: "isTrue",
      value: "b < c",
      message: "b:${$this.b} must be smaller than c:${$this.c}"
    }]
  };
  t.equal(v.validate({a: false, b: 1, c: 2}, rule), undefined);
  t.deepEqual(v.validate({a: true, b: 2, c: 1}, rule), {a: ['b:2 must be smaller than c:1']});

  t.end();
});

test('isTrue: lodash is in helper by default', t => {
  let rule = {
    a: {
      validate: "isTrue",
      value: "_.includes(a, 'apple')",
      message: "must contain apple"
    }
  };
  t.equal(v.validate({a: ['bar', 'apple', 'foo']}, rule), undefined);
  t.deepEqual(v.validate({a: ['bar', 'foo']}, rule), {a: ['must contain apple']});
  t.end();
});

test('Validation: can use helper', t => {
  let rule = {
    a: {
      validate: "isTrue",
      value: "myjoin(a) == 'bar-foo'",
      message: "lorem"
    }
  };

  const myjoin = arr => _.join(arr, '-');

  t.deepEqual(v.validate({a: ['bar', 'apple', 'foo']}, rule, {myjoin}), {a: ['lorem']});
  t.equal(v.validate({a: ['bar', 'foo']}, rule, {myjoin}), undefined);

  // if helper is missing
  t.throws(() => v.validate({a: ['bar', 'foo']}, rule));
  t.end();
});

test('isTrue: validates isTrue for single expression', t => {
  let rule = {
    a: "b < c"
  };
  t.equal(v.validate({a: false, b: 1, c: 2}, rule), undefined);
  t.deepEqual(v.validate({a: true, b: 2, c: 1}, rule), {a: ['must be true']});
  t.end();
});
