import test from 'tape';
import Validation from '../../src/validation';
import _ from 'lodash';

const v = new Validation();

test('isFalse: validates isFalse', t => {
  let rule = {a: {validate: "isFalse"}};
  t.deepEqual(v.validate({a: false}, rule), {});
  t.deepEqual(v.validate({a: true}, rule), {a: ['must be false']});

  rule = {a: {validate: "isFalse", message: '${$propertyPath}:${$value} is not false'}};
  t.deepEqual(v.validate({a: false}, rule), {});
  t.deepEqual(v.validate({a: true}, rule), {a: ['a:true is not false']});

  rule = {
    a: {
      validate: "isFalse",
      value: "b < c",
      message: "b:${$this.b} must be greater than c:${$this.c}"
    }
  };
  t.deepEqual(v.validate({a: true, b: 2, c: 1}, rule), {});
  t.deepEqual(v.validate({a: false, b: 1, c: 2}, rule), {a: ['b:1 must be greater than c:2']});

  rule = {
    a: [{
      validate: "isFalse",
      value: "b < c",
      message: "b:${$this.b} must be greater than c:${$this.c}"
    }]
  };
  t.deepEqual(v.validate({a: true, b: 2, c: 1}, rule), {});
  t.deepEqual(v.validate({a: false, b: 1, c: 2}, rule), {a: ['b:1 must be greater than c:2']});


  t.end();
});
