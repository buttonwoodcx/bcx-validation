import test from 'tape';
import Validation from '../src/validation';
import _ from 'lodash';

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

test('Validation: lodash is in helper by default', t => {
  let rule = {
    a: {
      validate: "isTrue",
      value: "_.includes(a, 'apple')",
      message: "must contain apple"
    }
  };
  t.deepEqual(v.validate({a: ['bar', 'apple', 'foo']}, rule), {});
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
  t.deepEqual(v.validate({a: ['bar', 'foo']}, rule, {myjoin}), {});

  // if helper is missing
  t.deepEqual(v.validate({a: ['bar', 'foo']}, rule), {a: ['lorem']}, 'missing helper yields undefined');
  t.end();
});

test('Validate: validates whole object', t => {
  let rule = {
    name: [
      {validate: "mandatory"},
      {validate: /[a-z]/i, message: "must only contain letters"}
    ],
    age: [
      "notMandatory",
      {validate: "number", integer: true, min: 0, max: 99}
    ]
  };

  t.deepEqual(v.validate({name: "hello", age: 20}), {});
  t.deepEqual(v.validate({name: "", age: null}, rule), {name: ["must not be empty"]});
  t.deepEqual(v.validate({name: ":-(", age: null}, rule), {name: ["must only contain letters"]});

  t.deepEqual(v.validate({name: ":-(", age: "20"}, rule), {
    name: ["must only contain letters"],
    age: ["must be a number"]
  });

  t.deepEqual(v.validate({name: "", age: 210.3}, rule), {
    name: ["must not be empty"],
    age: ["must be an integer"]
  });

  t.deepEqual(v.validate({name: "", age: 0}, rule), {
    name: ["must not be empty"]
  });

  t.deepEqual(v.validate({name: "", age: -1}, rule), {
    name: ["must not be empty"],
    age: ["must be at least 0"]
  });

  t.deepEqual(v.validate({name: "", age: 99}, rule), {
    name: ["must not be empty"]
  });

  t.deepEqual(v.validate({name: "", age: 100}, rule), {
    name: ["must not be empty"],
    age: ["must be no more than 99"]
  });

  t.end();
});

