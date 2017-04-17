import test from 'tape';
import Validation from '../../src/validation';
import _ from 'lodash';

const v = new Validation();

test('string: tests sring', t => {
  let rule = {a: {validate: "string"}};
  t.deepEqual(v.validate({a: 0}, rule), {a: ["must be a string"]});
  t.deepEqual(v.validate({a: '0'}, rule), {});
  t.end();
});

test('string: tests minLength, maxLength', t => {
  let rule = {a: {validate: "string", minLength: 4, maxLength: 8}};
  t.deepEqual(v.validate({a: 0}, rule), {a: ["must be a string"]});
  t.deepEqual(v.validate({a: '0'}, rule), {a: ["must has at least 4 characters"]});
  t.deepEqual(v.validate({a: '0234'}, rule), {});
  t.deepEqual(v.validate({a: '02345678'}, rule), {});
  t.deepEqual(v.validate({a: '023456789'}, rule), {a: ["must be no more than 8 characters"]});

  t.deepEqual(v.validate({a: '  02345678 '}, rule), {a: ["must be no more than 8 characters"]});

  // override value
  rule = {a: {validate: "string", value: "_.trim($value)", minLength: 4, maxLength: 8}};
  t.deepEqual(v.validate({a: '   02345678 '}, rule), {});
  t.end();
});
