import test from 'tape';
import Validation from '../../src/validation';
import _ from 'lodash';

const v = new Validation();

test('within: tests wthin', t => {
  let rule = {a: {validate: "within", items:['a', 'b']}};
  t.deepEqual(v.validate({a: 'c'}, rule), {a: ["must be one of a, b"]});
  t.deepEqual(v.validate({a: 'b'}, rule), {});
  t.end();
});

test('notIn: tests not within', t => {
  let rule = {a: {validate: "notIn", items:['a', 'b']}};
  t.deepEqual(v.validate({a: 'c'}, rule), {});
  t.deepEqual(v.validate({a: 'b'}, rule), {a: ["must not be one of a, b"]});
  t.end();
});

