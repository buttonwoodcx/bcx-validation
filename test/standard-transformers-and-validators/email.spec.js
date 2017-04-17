import test from 'tape';
import Validation from '../../src/validation';
import _ from 'lodash';

const v = new Validation();

test('email: tests email', t => {
  let rule = {a: {validate: "email"}};
  t.deepEqual(v.validate({a: 'c'}, rule), {a: ["not a valid email"]});
  t.deepEqual(v.validate({a: 'ab@test.com'}, rule), {});

  // shortcut
  rule = {a: "email"};
  t.deepEqual(v.validate({a: 'c'}, rule), {a: ["not a valid email"]});
  t.deepEqual(v.validate({a: 'ab@test.com'}, rule), {});
  t.end();
});
