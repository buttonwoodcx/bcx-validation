import test from 'tape';
import Validation from '../../src/validation';
import _ from 'lodash';

const v = new Validation();

test('isBlank: test blank', t => {
  let rule = {a: {validate: "isBlank"}};
  t.deepEqual(v.validate({a: undefined}, rule), {});
  t.deepEqual(v.validate({a: null}, rule), {});
  t.deepEqual(v.validate({a: []}, rule), {});
  t.deepEqual(v.validate({a: {}}, rule), {});
  t.deepEqual(v.validate({a: ""}, rule), {});
  t.deepEqual(v.validate({a: " \t  "}, rule), {});

  t.deepEqual(v.validate({a: 0}, rule), {a: ["must be blank"]});
  t.deepEqual(v.validate({a: /a/}, rule), {a: ["must be blank"]});
  t.deepEqual(v.validate({a: new Date()}, rule), {a: ["must be blank"]});
  t.deepEqual(v.validate({a: [null]}, rule), {a: ["must be blank"]});
  t.deepEqual(v.validate({a: {a: undefined}}, rule), {a: ["must be blank"]});
  t.end();
});

test('notBlank: test blank', t => {
  let rule = {a: {validate: "notBlank"}};
  t.deepEqual(v.validate({a: undefined}, rule), {a: ["must not be blank"]});
  t.deepEqual(v.validate({a: null}, rule), {a: ["must not be blank"]});
  t.deepEqual(v.validate({a: []}, rule), {a: ["must not be blank"]});
  t.deepEqual(v.validate({a: {}}, rule), {a: ["must not be blank"]});
  t.deepEqual(v.validate({a: ""}, rule), {a: ["must not be blank"]});
  t.deepEqual(v.validate({a: " \t  "}, rule), {a: ["must not be blank"]});

  t.deepEqual(v.validate({a: 0}, rule), {});
  t.deepEqual(v.validate({a: /a/}, rule), {});
  t.deepEqual(v.validate({a: new Date()}, rule), {});
  t.deepEqual(v.validate({a: [null]}, rule), {});
  t.deepEqual(v.validate({a: {a: undefined}}, rule), {});
  t.end();
});
