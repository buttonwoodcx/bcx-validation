import test from 'tape';
import Validation from '../src/validation';

const v = new Validation();

// built-in validators
test('Validation: validates isTrue', t => {
  let rule = {a: {validate: "isTrue"}};
  t.deepEqual(v.validate({a: true}, rule), {});
  t.deepEqual(v.validate({a: false}, rule), {a: ['must be true']});

  rule = {a: {validate: "isTrue", message: '${$propertyName}:${$value} is not true'}};
  t.deepEqual(v.validate({a: true}, rule), {});
  t.deepEqual(v.validate({a: false}, rule), {a: ['a:false is not true']});

  rule = {
    a: {
      validate: "isTrue",
      value: "b < c",
      message: "b:${$this.b} must be smaller than c:${$this.c}"
    }
  };
  t.deepEqual(v.validate({a: false, b: 1, c: 2}, rule), {});
  t.deepEqual(v.validate({a: true, b: 2, c: 1}, rule), {a: ['b:2 must be smaller than c:1']});

  rule = {
    a: [{
      validate: "isTrue",
      value: "b < c",
      message: "b:${$this.b} must be smaller than c:${$this.c}"
    }]
  };
  t.deepEqual(v.validate({a: false, b: 1, c: 2}, rule), {});
  t.deepEqual(v.validate({a: true, b: 2, c: 1}, rule), {a: ['b:2 must be smaller than c:1']});


  t.end();
});

test('Validation: validates isFalse', t => {
  let rule = {a: {validate: "isFalse"}};
  t.deepEqual(v.validate({a: false}, rule), {});
  t.deepEqual(v.validate({a: true}, rule), {a: ['must be false']});

  rule = {a: {validate: "isFalse", message: '${$propertyName}:${$value} is not false'}};
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
